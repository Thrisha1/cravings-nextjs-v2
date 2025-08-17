import { NextResponse } from "next/server";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { uploadCommonOffer } from "@/api/common_offers";
import { revalidateTag } from "@/app/actions/revalidate";
import { uploadFileToS3 } from "@/app/actions/aws-s3";
import { sendCommonOfferWhatsAppMsg } from "@/app/actions/sendWhatsappMsgs";
import convertLocToCoord from "@/app/actions/convertLocToCoord";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const {
			partner_name,
			item_name,
			price,
			location,
			description,
			insta_link,
			likes = 0,
			district,
			image_base64,
		} = body || {};

		if (!partner_name || !item_name || typeof price !== "number" || !district) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		let image_url: string | null = null;
		if (image_base64) {
			const formattedName = String(item_name)
				.replace(/[^a-zA-Z0-9]/g, "_")
				.replace(/\s+/g, "_")
				.replace(/_+/g, "_");
			image_url = await uploadFileToS3(
				image_base64,
				`common_offers/${formattedName}_${Date.now()}.webp`
			);
		}

		if (!location) {
			return NextResponse.json({ error: "Location link is required" }, { status: 400 });
		}

		let coordinates = null;
		try {
			coordinates = await convertLocToCoord(location as string);
		} catch (e) {
			return NextResponse.json({ error: "Invalid location link" }, { status: 400 });
		}

		const variables = {
			partner_name,
			item_name,
			price: Math.round(price),
			location: location || null,
			description: description || null,
			insta_link: insta_link || null,
			image_url: image_url,
			likes: likes ?? 0,
			district: String(district).toLowerCase(),
			coordinates,
		};

		const { insert_common_offers_one } = await fetchFromHasura(
			uploadCommonOffer,
			variables
		);

		await revalidateTag("all-common-offers");

		try {
			await sendCommonOfferWhatsAppMsg(insert_common_offers_one.id);
		} catch (e) {
			console.error("Failed to send WhatsApp message for common offer:", e);
		}

		return NextResponse.json({
			success: true,
			id: insert_common_offers_one.id,
			offer: insert_common_offers_one,
		});
	} catch (error) {
		console.error("Error creating common offer:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
} 
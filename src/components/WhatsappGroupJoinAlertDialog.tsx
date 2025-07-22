'use client';

import React, { useState, useEffect } from 'react';

const whatsappGroups = [
    { location: "ernakulam", link: "https://chat.whatsapp.com/link-for-ernakulam" },
    { location: "kozhikode", link: "https://chat.whatsapp.com/link-for-kozhikode" },
    { location: "thiruvananthapuram", link: "https://chat.whatsapp.com/link-for-thiruvananthapuram" },
    { location: "thrissur", link: "https://chat.whatsapp.com/link-for-thrissur" },
    { location: "kannur", link: "https://chat.whatsapp.com/link-for-kannur" },
];

const WhatsappGroupJoinAlertDialog = () => {
    const [showDialog, setShowDialog] = useState(false);
    const [groupLink, setGroupLink] = useState('');
    const [district, setDistrict] = useState('');

    useEffect(() => {
        const hasJoined = localStorage.getItem('whatsappDialogJoined');
        if (hasJoined === 'true') {
            return;
        }

        const closedTimestamp = localStorage.getItem('whatsappDialogClosedTimestamp');
        if (closedTimestamp) {
            const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - parseInt(closedTimestamp) < sevenDaysInMillis) {
                return;
            }
        }

        const timer = setTimeout(() => {
            fetchUserLocation();
        }, 10000);

        return () => clearTimeout(timer);
    }, []);

    const fetchUserLocation = () => {
        if (!navigator.geolocation) {
            return;
        }
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError);
    };

    const handleSuccess = async (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

        if (!mapboxToken) {
            console.error("Mapbox token is not configured.");
            return;
        }

        const apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=district,region&access_token=${mapboxToken}`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            console.log("Location data:", data);
            

            if (data.features && data.features.length > 0) {
                const features = data.features;
                const region = features.find((c : { id: string; text: string }) => c.id.startsWith('region'));
                const districtObj = features.find((c : { id: string; text: string }) => c.id.startsWith('district'));

                if (region && region.text.toLowerCase() === 'kerala' && districtObj) {
                    const userDistrict = districtObj.text.toLowerCase().replace(' district', '');
                    const foundGroup = whatsappGroups.find(
                        group => group.location.toLowerCase() === userDistrict
                    );

                    if (foundGroup) {
                        setGroupLink(foundGroup.link);
                        setDistrict(districtObj.text);
                        setShowDialog(true);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching location data:", error);
        }
    };

    const handleError = (error: GeolocationPositionError) => {
        console.error(`Geolocation error: ${error.message}`);
    };

    const handleJoin = () => {
        localStorage.setItem('whatsappDialogJoined', 'true');
    };

    const handleClose = () => {
        localStorage.setItem('whatsappDialogClosedTimestamp', Date.now().toString());
        setShowDialog(false);
    };

    if (!showDialog) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60"
            role="dialog"
            aria-modal="true"
        >
            <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-xl">
                <h2 className="mb-2 text-xl font-bold">Join our WhatsApp Group! 👋</h2>
                <p className="mb-6 text-gray-600">
                    It looks like you're in {district}. Join our local group for exclusive offers!
                </p>
                <div className="flex justify-center">
                    <a
                        href={groupLink}
                        onClick={handleJoin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-2 inline-block rounded bg-green-500 px-5 py-2 font-bold text-white transition-colors hover:bg-green-600"
                    >
                        Join Now
                    </a>
                    <button
                        onClick={handleClose}
                        className="rounded bg-gray-200 px-5 py-2 font-semibold text-gray-800 transition-colors hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsappGroupJoinAlertDialog;
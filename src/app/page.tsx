// import HomePage from "@/screens/HomePage";
// import { redirect } from "next/navigation";
import OfferMainPage from "./offers/page";


type SearchParams = Promise<{ [key: string]: string | undefined }>;

export default function Home(props: { searchParams: SearchParams }) {

  // return <HomePage />;

  return <OfferMainPage searchParams={props.searchParams} />
}

import HomePage from "@/screens/HomePage";
import { redirect } from "next/navigation";


export default function Home() {

  redirect('/offers');

  return <HomePage />;
}

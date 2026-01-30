import Image from "next/image";
import SideNav from "./components/ui/side-nav";

export default function Home() {
  return (
    <div>
      <div className="flex">
        <SideNav />
        <h1>Dashboard</h1>
      </div>
    </div>
  );
}

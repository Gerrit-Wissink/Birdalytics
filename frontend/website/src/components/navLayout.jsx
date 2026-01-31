import Navbar from "./navbar"
import { Outlet } from "react-router-dom"

export default function NavLayout(){
    return(
        <>
        <Navbar/>
        <main>
            <Outlet/>
        </main>
        </>
    )
}
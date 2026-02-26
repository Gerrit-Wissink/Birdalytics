import { useEffect } from 'react';

export default function Reports(){

    useEffect(() => {
        const token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (!token || (tokenExpiry && new Date(tokenExpiry) < new Date())) {
            window.location.href = '/#/login';
        }
    }, []);

    return(
        <>
        <section id="container">
            <h1>Reports Page</h1>
        </section>
        </>
    )
}
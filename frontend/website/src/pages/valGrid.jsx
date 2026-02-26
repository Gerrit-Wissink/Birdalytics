import { useEffect } from 'react';

export default function ValGrid(){

    useEffect(() => {
        const token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        if (!token || (tokenExpiry && new Date(tokenExpiry) < new Date())) {
            window.location.href = '/#/login';
        }
    }, []);

    return(
        <h1>Validation Grid Page</h1>
    )
}
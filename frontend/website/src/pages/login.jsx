import './login.css'

export default function LogIn(){
    return(
        <>
        <section id="login-container">
            <div id="login-logo">
                <img src="./images/GLTLogo.jpg" alt="Genesee Land Trust Logo" />
            </div>
            <div id="login-box">
                <h2>Birdalytics</h2>
                <form>
                    <div className="input-box">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" name="email" placeholder="user@geneseelandtrust.org" required />
                    </div>
                    <div className="input-box">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" name="password" placeholder="Enter your password" required />
                    </div>
                    <div className="button-box">
                        <button type="submit">Sign In</button>
                    </div>
                    <div className="forgot-password">
                        <a href="">Forgot password?</a>
                    </div>
                </form>
            </div>
        </section>
        </>
    );
}
export default function CamInfo(){
    return(
        <section id='camInfo-container'>
            <div id='camera-sidebar'>
                <h2>Cameras</h2>
            </div>
            <div id='camera-content'>
                <h1>Camera Name</h1>
                <div className = 'side-by-side'>
                    <div id='camera-summary'>
                        <h3>Camera Summary</h3>
                    </div>
                    <div id='identify-box'>
                        <h3>Species Identification</h3>
                    </div>
                </div>
            </div>
        </section>
    )
}
import {HashRouter as Router, Routes, Route} from "react-router-dom"
import CamInfo from "./pages/cameraInfo"
import Cameras from "./pages/cameras"
import LogIn from "./pages/login"
import Upload from "./pages/upload"
import ValGrid from "./pages/valgrid"
import Overview from "./pages/overview"
import Reports from "./pages/reports"
import NavLayout from "./components/navLayout"


function App() {

  return (
    <Router>
      <Routes>
        <Route element={<NavLayout/>}>
        <Route path="/login" element={<LogIn/>}/>
        <Route path="/" element={<Overview/>}/>
        <Route path="/reports" element={<Reports/>}/>
        <Route path="/upload" element={<Upload/>}/>
        <Route path="/valgrid" element={<ValGrid/>}/>
        <Route path="/caminfo" element={<CamInfo/>} />
        <Route path="/cameras" element={<Cameras/>} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

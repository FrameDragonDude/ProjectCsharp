import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout/AuthLayout';
import MainLayout from './layouts/MainLayout/MainLayout';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Home from './features/explore/Home';
import Search from './features/explore/Search';
import Library from './features/library/Library';
import PlaylistDetail from './features/library/PlaylistDetail';
import Notifications from './features/notification/Notifications';
import Profile from './features/auth/Profile'; // Import trang Hồ sơ
import ShareInbox from './features/share/ShareInbox';
import VideoPlayer from './features/player/VideoPlayer';
import AlbumDetail from './features/album/AlbumDetail';
import ArtistDetail from './features/artist/ArtistDetail';
import ProtectedRoute from './routes/ProtectedRoute';
import { useEffect } from 'react';
function App() {
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light'); 
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        
        <Route element={<MainLayout />}>
<<<<<<< HEAD

=======
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
>>>>>>> 1e48a6268a9fe5ffecd358378fc42ee3639a0389
          <Route path="/search" element={<Search />} />
          <Route path="/artist/:id" element={<ArtistDetail />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/playlist/:id" element={<PlaylistDetail />} />
            <Route path="/album/:id" element={<AlbumDetail />} />
            <Route path="/video/:id" element={<VideoPlayer />} />
            <Route path="/library" element={<Library />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/share" element={<ShareInbox />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

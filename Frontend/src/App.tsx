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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<MainLayout />}>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/artist/:id" element={<ArtistDetail />} />

          {/* Protected Routes */}
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

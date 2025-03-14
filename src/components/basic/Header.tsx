import { Link, useLocation } from 'react-router-dom';
import { resetSheetMetadata } from '@stores/sheetMetadataSlice';
import { resetSimpleScore } from '@stores/simpleScoreSlice';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@stores/authSlice';
import { RootState } from '@stores/store';

export default function Header() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="bg-transparent p-4 h-16">
      <div className="max-w-[90%] flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-100">
          ChordCove
        </Link>
        <nav className="flex items-center gap-6">
          <Link 
            to="/" 
            className={`text-gray-400 hover:text-gray-100 transition ${
              location.pathname === '/' ? 'text-gray-100' : ''
            }`}
          >
            首页
          </Link>
          <Link 
            to="/create" 
            onClick={()=>{
              dispatch(resetSimpleScore())
              dispatch(resetSheetMetadata())
            }}
            className={`text-gray-400 hover:text-gray-100 transition ${
              location.pathname === '/create' ? 'text-gray-100' : ''
            }`}
          >
            创建乐谱
          </Link>
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-100 transition"
            >
              退出
            </button>
          ) : (
            <Link
              to="/login"
              className={`text-gray-400 hover:text-gray-100 transition ${
                location.pathname === '/login' ? 'text-gray-100' : ''
              }`}
            >
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
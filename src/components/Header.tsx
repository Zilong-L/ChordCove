import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  return (
    <header className="bg-transparent p-4 mb-4">
      <div className="max-w-[90rem] mx-auto flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-100">
          ChordCove
        </Link>
        <nav className="flex gap-4">
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
            className={`text-gray-400 hover:text-gray-100 transition ${
              location.pathname === '/create' ? 'text-gray-100' : ''
            }`}
          >
            创建乐谱
          </Link>
        </nav>
      </div>
    </header>
  );
}
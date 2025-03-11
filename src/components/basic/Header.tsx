import { Link, useLocation } from 'react-router-dom';
import { resetSheetMetadata } from '@stores/sheetMetadataSlice';
import { resetSimpleScore } from '@stores/simpleScoreSlice';
import { useDispatch } from 'react-redux';
export default function Header() {
  const location = useLocation();
  const dispatch = useDispatch();
  return (
    <header className="bg-transparent p-4 ">
      <div className="max-w-[90%] flex items-center justify-between">
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
        </nav>
      </div>
    </header>
  );
}
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Footer() {
  const { userData } = useAuth();
  const navigate = useNavigate();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
        <p className="text-sm text-gray-500 cursor-default select-none">
          &copy; {new Date().getFullYear()} XvirorSMM. All rights reserved.
        </p>
        <div className="mt-4 sm:mt-0 flex space-x-6 text-sm text-gray-500">
          <a href="#" className="hover:text-gray-900 cursor-default" onClick={(e) => e.preventDefault()}>Terms</a>
          <a href="#" className="hover:text-gray-900 cursor-default" onClick={(e) => e.preventDefault()}>Privacy</a>
          <a href="https://t.me/Deleaxy" target="_blank" rel="noreferrer" className="hover:text-gray-900" onClick={(e) => e.stopPropagation()}>Support: @Deleaxy</a>
        </div>
      </div>
    </footer>
  );
}

import React from 'react';

const AdminFooter: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 py-4">
      <div className="container mx-auto px-6">
        <div className="text-center text-[11px] font-normal text-slate-500">
          <p>© {new Date().getFullYear()} SHOPPC · Arctic Frost</p>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;

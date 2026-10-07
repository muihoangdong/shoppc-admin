import React from 'react';

const AdminFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t mt-auto py-4">
      <div className="container mx-auto px-6">
        <div className="text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Shoppc Admin. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;

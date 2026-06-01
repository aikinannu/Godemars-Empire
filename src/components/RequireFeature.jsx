import React from 'react';
import { useLicense } from '../context/LicenseContext';
import { useNavigate } from 'react-router-dom';

const RequireFeature = ({ feature, children }) => {
  const { hasFeature } = useLicense();
  const navigate = useNavigate();

  if (hasFeature(feature)) return children;

  return (
    <div className="rounded-lg border border-yellow-600 bg-yellow-500/10 p-4 text-yellow-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">Feature locked</p>
          <p className="text-sm text-yellow-200/80">This feature requires an upgraded membership.</p>
        </div>
        <div>
          <button
            onClick={() => navigate('/license')}
            className="bg-yellow-500 text-black px-3 py-2 rounded-lg font-semibold"
          >
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequireFeature;

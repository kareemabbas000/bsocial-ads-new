import React from 'react';

interface MetaPartnerBadgeProps {
    className?: string;
}

const MetaPartnerBadge: React.FC<MetaPartnerBadgeProps> = ({ className = '' }) => {
    return (
        <div
            className={`relative group flex justify-center items-center py-6 px-8 transition-all duration-500 ease-out hover:scale-105 ${className}`}
        >
            {/* Glow Effect on Hover */}
            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 rounded-xl blur-xl transition-all duration-700 pointer-events-none"></div>

            {/* Badge Image */}
            <img
                src="https://cazzpapjwollapnxoqmx.supabase.co/storage/v1/object/public/new%20bucket/meta_partner_logo.png"
                alt="Meta Business Partner"
                className="h-16 md:h-24 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-sm filter grayscale-[30%] group-hover:grayscale-0"
                loading="lazy"
            />
        </div>
    );
};

export default MetaPartnerBadge;

import React from 'react';

interface Shop {
    name: string;
    logo: string; // URL to the logo image
    url: string;
    category: 'General' | 'Moda' | 'Supermercado';
}

const shops: Shop[] = [
    { name: 'Amazon', logo: 'https://logo.clearbit.com/amazon.es', url: 'https://www.amazon.es', category: 'General' },
    { name: 'Shein', logo: 'https://logo.clearbit.com/shein.com', url: 'https://es.shein.com', category: 'Moda' },
    { name: 'Zalando', logo: 'https://logo.clearbit.com/zalando.es', url: 'https://www.zalando.es', category: 'Moda' },
    { name: 'Zara', logo: 'https://logo.clearbit.com/zara.com', url: 'https://www.zara.com/es/', category: 'Moda' },
    { name: 'Carrefour', logo: 'https://logo.clearbit.com/carrefour.es', url: 'https://www.carrefour.es', category: 'Supermercado' },
    { name: 'Dia', logo: 'https://logo.clearbit.com/dia.es', url: 'https://www.dia.es', category: 'Supermercado' },
    { name: 'Lidl', logo: 'https://logo.clearbit.com/lidl.es', url: 'https://www.lidl.es', category: 'Supermercado' },
    { name: 'Mercadona', logo: 'https://logo.clearbit.com/mercadona.es', url: 'https://www.mercadona.es', category: 'Supermercado' },
];

const ShopCard: React.FC<{ shop: Shop }> = ({ shop }) => (
    <a 
        href={shop.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="bg-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center space-y-3 hover:shadow-lg hover:-translate-y-1 transition-all aspect-square"
    >
        <div className="w-12 h-12 relative">
            <img 
                src={shop.logo} 
                alt={`${shop.name} logo`} 
                className="h-full w-full object-contain rounded-full" 
                onError={(e) => { 
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling;
                    if (fallback) {
                        fallback.classList.remove('hidden');
                    }
                }} 
            />
            <div className="hidden absolute inset-0 h-full w-full bg-momflow-lavender rounded-full flex items-center justify-center text-xl font-bold text-momflow-text-dark">
                {shop.name.charAt(0)}
            </div>
        </div>
        <p className="font-semibold text-momflow-text-dark text-center text-sm">{shop.name}</p>
    </a>
);


const ShoppingScreen: React.FC = () => {
    const categories = ['General', 'Moda', 'Supermercado'];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-momflow-text-dark">Compras</h1>
                <p className="text-momflow-text-light">Acceso rápido a tus tiendas favoritas.</p>
            </header>

            {categories.map(category => (
                <section key={category}>
                    <h2 className="text-xl font-semibold mb-4 text-momflow-text-dark">{category}</h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {shops.filter(shop => shop.category === category).map(shop => (
                            <ShopCard key={shop.name} shop={shop} />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};

export default ShoppingScreen;

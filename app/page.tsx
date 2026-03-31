import React, { useState } from 'react';
import { ProductType } from '../types';

const ProductList: React.FC<{ products: ProductType[] }> = ({ products }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = products.filter((product) => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <ul>
                {filteredProducts.map((product) => (
                    <li key={product.id}>{product.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default ProductList;

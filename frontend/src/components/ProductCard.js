import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { formatRupiah } from '../lib/utils';

export default function ProductCard({ product }) {
  const { addToCart } = useAppContext();

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-square">
        <img
          src={product.image}
          alt={product.name}
          className="object-cover w-full h-full"
        />
        {product.stock < 10 && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive">Sisa {product.stock}</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground mb-1">{product.category}</div>
        <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="font-mono font-extrabold text-emerald-700 text-lg">
            {formatRupiah(product.price)}
          </span>
          <span className="text-sm text-gray-500">/{product.unit}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={() => addToCart(product)}
          className="w-full flex items-center justify-center gap-2"
          disabled={product.stock === 0}
        >
          <ShoppingCart className="h-4 w-4" />
          {product.stock === 0 ? 'Habis' : 'Tambah'}
        </Button>
      </CardFooter>
    </Card>
  );
}

'use client';
import { useState } from 'react';
import type { CartItem } from '@/types';
import toast from 'react-hot-toast';
import { Button, EmptyProductBoxIcon, Title, Text } from 'rizzui';
import cn from '@/utils/class-names';
import { useCart } from '@/store/quick-cart/cart.context';
import POSOrderProducts from '@/app/shared/point-of-sale/pos-order-products';
import DrawerHeader from '@/app/shared/drawer-header';
import app from '@/app/(main)/firebase-config'; // Assurez-vous que ce chemin est correct
import { getDatabase, ref, set, push } from 'firebase/database';
import { AuthContextType, auth, useAuthContext } from '@/app/(main)/authContext'; // Importation du contexte d'authentification

type POSOrderTypes = {
  className?: string;
  simpleBarClassName?: string;
  orderedItems: CartItem[];
  onOrderSuccess?: () => void;
  removeItemFromCart: (id: number) => void;
  clearItemFromCart: (id: number) => void;
};

export default function POSDrawerView({
  className,
  simpleBarClassName,
  orderedItems,
  onOrderSuccess,
  removeItemFromCart,
  clearItemFromCart,
}: POSOrderTypes) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext() as AuthContextType;// Utilisation du contexte d'authentification

  async function handleOrder() {
    if (!user) {
      toast.error(<Text as="b">Vous devez être connecté pour passer une commande</Text>);
      return;
    }

    setLoading(true);

    try {
      const db = getDatabase(app);
      const orderRef = ref(db, 'CLICommande');
      const newOrderRef = push(orderRef);
      const orderId = newOrderRef.key;
      const productIds = orderedItems.map(item => item.id);
      const orderTime = new Date().toISOString();
      const userEmail = user.email;
    // Afficher les données de la commande dans la console
    console.log('Données de la commande :');
    console.log('ID de la commande :', orderId);
    console.log('IDs des produits :', productIds);
    console.log('Heure de la commande :', orderTime);
    console.log('Adresse e-mail de l\'utilisateur :', userEmail);
      await set(newOrderRef, {
        orderId,
        productIds,
        orderTime,
        userEmail,
      });

      setLoading(false);
      console.log('createOrder data ->', orderedItems);
      toast.success(<Text as="b">Commande confirmée</Text>);
      onOrderSuccess && onOrderSuccess();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(<Text as="b">Erreur lors de la confirmation de la commande</Text>);
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        'sticky top-3 flex h-[calc(100vh-120px)] flex-col justify-between rounded-lg border border-muted pb-7 xl:top-24',
        className
      )}
    >
      <DrawerHeader
        heading="Panier"
        onClose={() => (onOrderSuccess ? onOrderSuccess() : () => null)}
      />
      <div className="px-5 pb-0 pe-3 lg:px-7 lg:pb-0">
        {!!orderedItems?.length && (
          <POSOrderProducts
            orderedItems={orderedItems}
            removeItemFromCart={removeItemFromCart}
            clearItemFromCart={clearItemFromCart}
            itemClassName="pe-4"
            simpleBarClassName={simpleBarClassName}
            showControls
          />
        )}
      </div>
      {!orderedItems?.length && (
        <div className="flex h-full flex-col justify-between">
          <span />
          <div>
            <EmptyProductBoxIcon className="mx-auto h-auto w-52 text-gray-400" />
            <Title as="h5" className="mt-6 text-center">
              Panier vide
            </Title>
            <Text className="mt-1 text-center">Ajouter au moins un article ! </Text>
          </div>
          <div className="px-4">
            <Button
              className="w-full"
              variant="flat"
              onClick={() => (onOrderSuccess ? onOrderSuccess() : () => null)}
            >
              Retour
            </Button>
          </div>
        </div>
      )}
      {!!orderedItems?.length && (
        <div className="border-t border-gray-300 p-5 pb-0 lg:p-7">
          <PriceCalculation />
          <div className="flex flex-col gap-4">
            <Button
              className="h-11 w-full"
              isLoading={loading}
              onClick={handleOrder}
            >
              Commander
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const TAX_PERCENTAGE = 5;

export function PriceCalculation() {
  const { items } = useCart();
  const total = items.reduce(
    (acc, item) => acc + (item?.salePrice ?? item.price) * item.quantity,
    0
  );
  const tax = total * (TAX_PERCENTAGE / 100);
  const subTotal = total + tax;

  return (
    <div className="mb-7 space-y-3.5">
      <p className="flex items-center justify-between">
        <span className="text-gray-500">Total</span>
        <span className="font-medium text-gray-900">€{total.toFixed(2)}</span>
      </p>
  
      <p className="flex items-center justify-between">
        <span className="text-gray-500">TVA</span>
        <span className="font-medium text-gray-900">€{tax.toFixed(2)}</span>
      </p>
      <p className="flex items-center justify-between border-t border-gray-300 pt-3.5 text-base font-semibold">
        <span className="text-gray-900">Total:</span>
        <span className="text-gray-900">€{subTotal.toFixed(2)}</span>
      </p>
    </div>
  );
}

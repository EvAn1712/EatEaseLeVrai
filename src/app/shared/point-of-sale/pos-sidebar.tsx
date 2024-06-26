'use client';
// panier partie en haut
import React, { useState } from 'react';
import { CartItem } from '@/types';
import { EmptyProductBoxIcon, Button, Title, Text } from 'rizzui';
import toast from 'react-hot-toast';
import { PriceCalculation } from '@/app/shared/point-of-sale/pos-drawer-view';
import POSOrderProductsTwo from '@/app/shared/point-of-sale/pos-order-products-two';
import { useCart } from '@/store/quick-cart/cart.context';
import { AuthContextType, useAuthContext } from '@/app/(main)/authContext';
import app from "@/app/(main)/firebase-config";
import { getDatabase, ref, set, push } from 'firebase/database';

type PosSidebarProps = {
  simpleBarClassName?: string;
  orderedItems: CartItem[];
  removeItemFromCart: (id: number) => void;
  clearItemFromCart: (id: number) => void;
};

function PostSidebar({
  simpleBarClassName,
  orderedItems,
  removeItemFromCart,
  clearItemFromCart,
}: PosSidebarProps) {
  const [loading, setLoading] = useState(false);
  const { resetCart , items} = useCart();
  const { user } = useAuthContext() as AuthContextType;

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
      const productDetails =
        orderedItems.map(item => ({
        id: item.originalId,
        quantity: item.quantity,
        name: item.name
      }));
      const orderTime = new Date().toISOString();
      const userEmail = user.email;
      const statut = false;
      // Fonction pour calculer le prix total du panier
  const total = items.reduce(
    (acc, item) => acc + ( item.price) * item.quantity,
    0
  );
  const tax = total * 0.05;
  const subTotal = parseFloat((total).toFixed(2));

      await set(newOrderRef, {
        productDetails,
        orderTime,
        userEmail,
        total: subTotal,
        statut,
      });

      setLoading(false);
      console.log('createOrder data ->', orderedItems);
      toast.success(<Text as="b">Commande confirmée</Text>);
      resetCart();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(<Text as="b">Erreur lors de la confirmation de la commande</Text>);
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-5 py-3 lg:px-7">
        <Title as="h5" className="font-semibold">
          Mon panier
        </Title>
        {orderedItems?.length > 0 && (
          <Button variant="text" onClick={resetCart} className="pe-0">
            Tout supprimer
          </Button>
        )}
      </div>
      <div className="ps-5 lg:ps-7">
        {!!orderedItems?.length && (
          <POSOrderProductsTwo
            orderedItems={orderedItems}
            removeItemFromCart={removeItemFromCart}
            clearItemFromCart={clearItemFromCart}
            simpleBarClassName={simpleBarClassName}
            showControls
          />
        )}
      </div>
      {!orderedItems?.length && (
        <div className="flex h-full flex-col justify-center">
          <span />
          <div>
            <EmptyProductBoxIcon className="mx-auto h-auto w-52 text-gray-400" />
            <Title as="h5" className="mt-6 text-center">
              Votre panier est vide
            </Title>
            <Text className="mt-1 text-center">Commander maintenant</Text>
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
              disabled={!user}
            >
              Commander Point of sale
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default PostSidebar;

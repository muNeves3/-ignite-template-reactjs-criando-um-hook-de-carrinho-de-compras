import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let newCart = [...cart];
      const productExistsInCart = newCart.find(
        (product) => product.id === productId
      );

      const stock = await api.get(`stock/${productId}`);
      //caso já exista o produto, irá adicionar 1 a sua quantidade (com validações)
      if (productExistsInCart) {
        // + 1 pois estará adicionando uma unidade a um produto que já está no carrinho
        if (productExistsInCart.amount + 1 > stock.data.amount) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        } else {
          productExistsInCart.amount += 1;
        }
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));

        //se o produto não existir, adicionar, com a quantidade 1
      } else {
        let newCart = [...cart];

        const product = await api.get(`products/${productId}`);
        const newProduct = {
          ...product.data,
          amount: 1,
        };

        newCart.push(newProduct);
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      }
    } catch (e) {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExistsInCart = cart.findIndex(
        (item) => item.id === productId
      );
      if (productExistsInCart >= 0) {
        var newCart = [...cart];

        newCart.splice(productExistsInCart, 1);
        console.log(newCart);
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      } else {
        toast.error("Erro na remoção do produto");
        return;
      }
    } catch (e) {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        toast.error("Quantidade invalida");
        return;
      }

      const productExistsInCart = cart.findIndex(
        (item) => item.id === productId
      );

      const { data } = await api.get(`/stock/${productId}`);
      const productAmount = amount;
      const newAmount = productAmount + 1;

      if (productExistsInCart !== -1) {
        var newCart = [...cart];

        if (newAmount > data.amount && newAmount > 0) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        } else {
          newCart.map((product) => {
            if (product.id === productId) {
              product.amount = amount;
            }
          });

          setCart(newCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
        }
      } else {
        toast.error("Erro na alteração de quantidade do produto");
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

import { cartTotal, itemKey, useCart } from "./cart";
import type { Product, Topping } from "./types";
const product: Product = {
  id: 1,
  name: "Cà phê sữa",
  price: 35000,
  category: "Cà phê",
  description: "",
  imageUrl: "/images/ca-phe-sua.svg",
  stock: 100,
  available: true,
};
const toppings: Topping[] = [
  { id: 2, name: "Kem", price: 8000 },
  { id: 1, name: "Trân châu", price: 5000 },
];
beforeEach(() => useCart.getState().clear());
it("CART-T01 canonical topping order merges identical choices", () => {
  expect(itemKey(1, "M", toppings)).toBe(
    itemKey(1, "M", [...toppings].reverse()),
  );
  useCart.getState().add(product, "M", toppings, 1);
  useCart.getState().add(product, "M", [...toppings].reverse(), 2);
  expect(useCart.getState().items).toHaveLength(1);
  expect(useCart.getState().items[0].qty).toBe(3);
  expect(cartTotal(useCart.getState().items)).toBe(159000);
});
it("CART-T02 different sizes stay separate and totals update with quantity and removal", () => {
  const c = useCart.getState();
  c.add(product, "S", [], 1);
  c.add(product, "L", [], 2);
  expect(cartTotal(useCart.getState().items)).toBe(125000);
  c.quantity(itemKey(1, "S", []), 3);
  expect(cartTotal(useCart.getState().items)).toBe(195000);
  c.remove(itemKey(1, "L", []));
  expect(cartTotal(useCart.getState().items)).toBe(105000);
});
it("CART-T03 quantities stay within domain limits", () => {
  useCart.getState().add(product, "S", [], 30);
  const key = itemKey(1, "S", []);
  expect(useCart.getState().items[0].qty).toBe(20);
  useCart.getState().quantity(key, 0);
  expect(useCart.getState().items[0].qty).toBe(1);
});
it("CART-T04 cart persists and clears after successful checkout", () => {
  useCart.getState().add(product, "S", [], 1);
  expect(
    JSON.parse(localStorage.getItem("brewlite-cart")!).state.items[0].productId,
  ).toBe(1);
  useCart.getState().clear();
  expect(
    JSON.parse(localStorage.getItem("brewlite-cart")!).state.items,
  ).toEqual([]);
});

it("CART-T05 quantity edits round to whole drinks", () => {
  useCart.getState().add(product, "S", [], 1);
  useCart.getState().quantity(itemKey(1, "S", []), 1.7);
  expect(useCart.getState().items[0].qty).toBe(1);
});

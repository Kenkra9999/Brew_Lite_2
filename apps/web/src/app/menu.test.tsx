import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Menu from "./page";
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));
const products = [
  {
    id: 1,
    name: "Cà phê sữa",
    category: "Cà phê",
    price: 35000,
    stock: 10,
    available: true,
    imageUrl: "/images/ca-phe-sua.svg",
    description: "Đậm đà",
  },
  {
    id: 2,
    name: "Trà đào",
    category: "Trà",
    price: 39000,
    stock: 0,
    available: false,
    imageUrl: "/images/tra-dao.svg",
    description: "Thơm mát",
  },
];
afterEach(() => vi.restoreAllMocks());
it("WEB-T01 loads API menu and filters by category and search", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(products)),
  );
  render(<Menu />);
  expect(screen.getByRole("status")).toBeInTheDocument();
  await screen.findByRole("heading", { name: "Cà phê sữa" });
  expect(screen.getByText("Tạm hết")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Trà" }));
  expect(
    screen.queryByRole("heading", { name: "Cà phê sữa" }),
  ).not.toBeInTheDocument();
  await userEvent.type(
    screen.getByRole("textbox", { name: "Tìm đồ uống" }),
    "không có",
  );
  expect(screen.getByText("Chưa tìm thấy món phù hợp")).toBeInTheDocument();
});
it("WEB-T02 API failure shows retry and can recover", async () => {
  const f = vi
    .spyOn(globalThis, "fetch")
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue(new Response(JSON.stringify(products)));
  render(<Menu />);
  await screen.findByRole("alert");
  await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
  await waitFor(() => expect(f).toHaveBeenCalledTimes(2));
  await screen.findByRole("heading", { name: "Cà phê sữa" });
});
it("WEB-T03 empty API menu is readable", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("[]"));
  render(<Menu />);
  await screen.findByText("Chưa tìm thấy món phù hợp");
});

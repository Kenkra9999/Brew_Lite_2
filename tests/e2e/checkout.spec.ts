import { test, expect } from "@playwright/test";
test("E2E-T01 real menu → custom drink → register → wallet → confirmation → history", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Hôm nay, bạn uống gì?" }),
  ).toBeVisible();
  await page.getByRole("heading", { name: "Cappuccino", exact: true }).click();
  await page.getByRole("radio", { name: /M/ }).check();
  await page.getByRole("checkbox", { name: "Trân châu" }).check();
  await page.getByRole("button", { name: /Thêm vào giỏ/ }).click();
  await page.getByRole("link", { name: "Xem giỏ hàng →" }).click();
  await expect(
    page.getByRole("heading", { name: "Giỏ hàng của bạn" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Cappuccino" })).toBeVisible();
  await page.getByRole("link", { name: /Tiếp tục thanh toán/ }).click();
  await page.getByRole("link", { name: "Đăng nhập / Đăng ký" }).click();
  await page.getByRole("button", { name: "Đăng ký ngay" }).click();
  await page.getByLabel("Họ và tên").fill("Khách E2E");
  await page
    .getByLabel("Email", { exact: true })
    .fill(`e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@test.vn`);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("Testpass123");
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Thanh toán", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Mã ưu đãi").fill("WELCOME10");
  await page.getByRole("button", { name: "Xác nhận thanh toán →" }).click();
  await expect(
    page.getByRole("heading", { name: "Cảm ơn bạn đã đặt hàng!" }),
  ).toBeVisible();
  await expect(page.locator(".status")).toHaveText("Đã thanh toán");
  await expect(
    page.getByText("Bạn nhận được 4 điểm cho đơn này."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Đơn của tôi", exact: true }).click();
  await expect(page.locator(".order-card")).toHaveCount(1);
  await expect(page.locator(".order-card")).toContainText("Cappuccino");
  await expect(
    page.getByRole("link", { name: "Giỏ hàng 0 món" }),
  ).toBeVisible();
  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    view: window.innerWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.view);
});

test("E2E-T02 declined payment keeps cart and retry pays the same order", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("heading", { name: "Cappuccino", exact: true }).click();
  await page.getByRole("button", { name: /Thêm vào giỏ/ }).click();
  await page.goto("/auth?next=/checkout");
  await page.getByLabel("Email", { exact: true }).fill("demo@brewlite.vn");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("Demo@1234");
  await page.getByRole("button", { name: "Đăng nhập →" }).click();
  await expect(
    page.getByRole("heading", { name: "Thanh toán", exact: true }),
  ).toBeVisible();
  await page.getByRole("radio", { name: /Thẻ ngân hàng/ }).check();
  await page
    .getByRole("textbox", { name: "Số thẻ thử nghiệm" })
    .fill("4000000000000002");
  await page.getByRole("button", { name: "Xác nhận thanh toán →" }).click();
  await expect(page.getByRole("alert").filter({hasText: 'CARD_DECLINED'})).toBeVisible();
  const pending = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("brewlite-pending")!),
  );
  await expect(
    page.getByRole("link", { name: "Giỏ hàng 1 món" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Số thẻ thử nghiệm" })
    .fill("4242424242424242");
  await page
    .getByRole("button", { name: "Tiếp tục thanh toán", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp("/orders/" + pending.orderId + "$"));
  await expect(
    page.getByRole("heading", { name: "Cảm ơn bạn đã đặt hàng!" }),
  ).toBeVisible();
});

test('E2E-T03 canceling another order preserves pending and history can resume the same order', async ({page}) => {
  const registration=await page.request.post('/api/auth/register',{data:{email:`resume-${Date.now()}-${Math.random().toString(36).slice(2)}@test.vn`,password:'Testpass123',fullName:'Khách khôi phục'}});
  expect(registration.ok()).toBeTruthy();
  const {accessToken}=await registration.json();
  const products=await (await page.request.get('/api/products')).json();
  const product=products.find((p:{name:string})=>p.name==='Americano');
  const makeOrder=async()=>{const r=await page.request.post('/api/orders',{headers:{Authorization:`Bearer ${accessToken}`},data:{items:[{productId:product.id,size:'M',qty:1}]}});expect(r.ok()).toBeTruthy();return r.json();};
  const old=await makeOrder(),current=await makeOrder();
  await page.goto('/');
  await page.evaluate(({accessToken,current})=>{sessionStorage.setItem('brewlite-token',accessToken);sessionStorage.setItem('brewlite-pending',JSON.stringify({orderId:current.id,key:'',method:'WALLET',fingerprint:'[]'}));localStorage.removeItem('brewlite-cart');},{accessToken,current});
  await page.goto('/orders/'+old.id);
  await page.getByRole('button',{name:'Hủy đơn',exact:true}).click();
  await expect(page.locator('.status')).toHaveText('Đã hủy');
  expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('brewlite-pending')!).orderId)).toBe(current.id);
  await page.goto('/orders/'+current.id);
  await page.getByRole('link',{name:'Tiếp tục thanh toán đơn này'}).click();
  await expect(page.locator('.summary')).toContainText('Americano');
  await page.getByRole('button',{name:'Tiếp tục thanh toán',exact:true}).click();
  await expect(page).toHaveURL(new RegExp('/orders/'+current.id+'$'));
  await expect(page.getByRole('heading',{name:'Cảm ơn bạn đã đặt hàng!'})).toBeVisible();
});

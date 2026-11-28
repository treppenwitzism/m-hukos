import { Routes } from '@angular/router';
import { CustomerLayoutComponent } from './layout/customer-layout.component';
import { MenuComponent } from './pages/menu/menu.component';
import { LoginComponent } from './pages/login/login.component';
import { ItemComponent } from './pages/item/item.component';
import { authGuard, roleGuard } from './core/guards';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { OrderDetailComponent } from './pages/orders/order-detail.component';
import { AccountComponent } from './pages/account/account.component';
import { StaffLayoutComponent } from './layout/staff-layout.component';
import { StaffVerifyComponent } from './pages/staff/staff-verify.component';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/admin/dashboard.component';
import { AdminMenuComponent } from './pages/admin/menu-admin.component';
import { AdminOrdersComponent } from './pages/admin/orders-admin.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'staff',
    component: StaffLayoutComponent,
    canActivate: [authGuard, roleGuard('staff', 'admin')],
    children: [
      { path: '', component: StaffVerifyComponent },
      { path: 'verify/:token', component: StaffVerifyComponent },
    ],
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard('admin')],
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'menu', component: AdminMenuComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: '**', redirectTo: '' },
    ],
  },
  {
    path: '',
    component: CustomerLayoutComponent,
    children: [
      { path: '', component: MenuComponent },
      { path: 'item/:id', component: ItemComponent },
      { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
      { path: 'orders', component: OrdersComponent, canActivate: [authGuard] },
      { path: 'orders/:id', component: OrderDetailComponent, canActivate: [authGuard] },
      { path: 'account', component: AccountComponent, canActivate: [authGuard] },
    ],
  },
  { path: '**', redirectTo: '' },
];
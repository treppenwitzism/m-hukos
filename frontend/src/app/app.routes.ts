import { Routes } from '@angular/router';
import { CustomerLayoutComponent } from './layout/customer-layout.component';
import { MenuComponent } from './pages/menu/menu.component';
import { LoginComponent } from './pages/login/login.component';
import { ItemComponent } from './pages/item/item.component';
import { authGuard } from './core/guards';
import { CheckoutComponent } from './pages/checkout/checkout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: CustomerLayoutComponent,
    children: [
      { path: '', component: MenuComponent },
      { path: 'item/:id', component: ItemComponent },
            { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
    ],
  },
  { path: '**', redirectTo: '' },
];
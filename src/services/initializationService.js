import { findAll, insert } from '../database/categoryRepository.js';

export async function initializeDatabase() {
  const categories = await findAll();

  if (!categories.length) {
    insert({ name: 'Mercado', iconName: 'LocalGroceryStoreIcon' });
    insert({ name: 'Receita', iconName: 'AttachMoneyIcon' });
    insert({ name: 'Salário', iconName: 'AttachMoneyIcon' });
    insert({ name: 'Transporte', iconName: 'DirectionsCarIcon' });
    insert({ name: 'Saúde', iconName: 'LocalHospitalIcon' });
    insert({ name: 'Lazer', iconName: 'DirectionsBikeIcon' });
  }
}

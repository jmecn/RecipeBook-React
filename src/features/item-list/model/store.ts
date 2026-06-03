import { create } from 'zustand';
import type { Item } from '../../../entities/item/model';

interface ItemListState {
  keyword: string;
  items: Item[];
  setKeyword: (next: string) => void;
}

const demoItems: Item[] = [
  { id: 'minecraft:iron_ingot' },
  { id: 'minecraft:gold_ingot' },
  { id: 'tfc:ore/rich_native_copper' },
];

export const useItemListStore = create<ItemListState>((set) => ({
  keyword: '',
  items: demoItems,
  setKeyword: (next) => set({ keyword: next }),
}));

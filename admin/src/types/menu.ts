export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
  isAvailable?: boolean;
  isPopular?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isSpicy?: boolean;
  customizations?: Customization[];
}

export interface Customization {
  id: string;
  name: string;
  options: CustomizationOption[];
  required?: boolean;
  maxSelections?: number;
}

export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customizations: SelectedCustomization[];
  totalPrice: number;
}

export interface SelectedCustomization {
  customizationId: string;
  optionIds: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sortOrder?: number;
  isActive?: boolean;
}

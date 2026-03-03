const spiceLevelCustomization = {
  id: "spice",
  name: "Spice Level",
  required: true,
  options: [
    { id: "none", name: "None", price: 0 },
    { id: "mild", name: "Mild", price: 0 },
    { id: "medium", name: "Medium", price: 0 },
    { id: "hot", name: "Hot 🌶️", price: 0 },
  ],
};

const sauceCustomization = {
  id: "sauces",
  name: "Sauces",
  maxSelections: 3,
  options: [
    { id: "garlic", name: "Garlic Sauce", price: 0 },
    { id: "chilli", name: "Chilli Sauce", price: 0 },
    { id: "tahini", name: "Tahini", price: 0 },
  ],
};

const mainAddOns = {
  id: "addons",
  name: "Add-ons",
  maxSelections: 4,
  options: [
    { id: "extra-halloumi", name: "Extra Halloumi (2 pcs)", price: 2.95 },
    {
      id: "extra-shawarma-chicken",
      name: "Extra Shawarma Chicken",
      price: 4.5,
    },
    { id: "extra-shawarma-lamb", name: "Extra Shawarma Lamb", price: 4.95 },
    { id: "extra-falafel", name: "Extra Falafel (2 pcs)", price: 1.5 },
  ],
};

const sideChoice = {
  id: "side",
  name: "Choose Side",
  required: true,
  options: [
    { id: "rice", name: "Rice", price: 0 },
    { id: "chips", name: "Chips", price: 0 },
    { id: "half-half", name: "Half & Half", price: 0 },
    { id: "spicy-rice", name: "Spicy Rice", price: 0.25 },
    { id: "spicy-fries", name: "Spicy Fries", price: 0.3 },
  ],
};

const sideUpgrades = {
  id: "side-upgrades",
  name: "Side Upgrades",
  maxSelections: 1,
  options: [
    { id: "no-side", name: "No side upgrade", price: 0 },
    { id: "regular-fries", name: "Regular Fries", price: 2.95 },
    { id: "spicy-fries", name: "Spicy Fries", price: 3.25 },
    { id: "rice", name: "Rice", price: 3.5 },
    { id: "spicy-rice", name: "Spicy Rice", price: 3.75 },
  ],
};

const drinkUpgrades = {
  id: "drink-upgrades",
  name: "Drink Upgrades",
  maxSelections: 1,
  options: [
    { id: "no-drink", name: "No drink upgrade", price: 0 },
    { id: "can-drink", name: "Coca-Cola / Fanta / Sprite", price: 2.45 },
    { id: "ayran", name: "Ayran", price: 2.75 },
    { id: "water", name: "Still / Sparkling Water", price: 1.95 },
  ],
};

const menuItems = [
  // Cold Starters
  {
    name: "Hummus with Bread",
    description: "Creamy chickpea dip served with warm pita.",
    price: 6.5,
    category: "cold-starters",
    isPopular: true,
    isVegetarian: true,
    isVegan: true,
  },
  {
    name: "Baba Ghanoush",
    description: "Smoked aubergine dip with tahini & lemon.",
    price: 6.5,
    category: "cold-starters",
    isVegetarian: true,
    isVegan: true,
  },
  {
    name: "Fattoush Salad",
    description: "Fresh salad with crispy pita & tangy sumac dressing.",
    price: 6.5,
    category: "cold-starters",
    isVegetarian: true,
    isVegan: true,
  },
  {
    name: "Tabbouleh",
    description: "Finely chopped parsley salad with bulgur & lemon.",
    price: 6.5,
    category: "cold-starters",
    isVegetarian: true,
    isVegan: true,
  },
  {
    name: "Lebanese Salad",
    description: "Garden salad with olive oil & lemon.",
    price: 6.5,
    category: "cold-starters",
    isVegetarian: true,
    isVegan: true,
  },
  {
    name: "Feta Cheese Salad",
    description: "Mixed greens with feta & olives.",
    price: 6.5,
    category: "cold-starters",
    isVegetarian: true,
  },
  {
    name: "Mixed Pickles",
    description: "Authentic Lebanese pickles.",
    price: 5.5,
    category: "cold-starters",
    isVegetarian: true,
    isVegan: true,
  },

  // Hot Starters
  {
    name: "Falafel (4 pcs)",
    description: "Crispy chickpea patties with tahini sauce.",
    price: 6.95,
    category: "hot-starters",
    isPopular: true,
    isVegetarian: true,
    isVegan: true,
    customizations: [sauceCustomization],
  },
  {
    name: "Grilled Halloumi",
    description: "Served with tomato & olive oil drizzle.",
    price: 6.95,
    category: "hot-starters",
    isVegetarian: true,
  },
  {
    name: "Hummus Shawarma Chicken",
    description: "Hummus topped with juicy chicken shawarma.",
    price: 6.95,
    category: "hot-starters",
    isPopular: true,
  },
  {
    name: "Hummus Shawarma Lamb",
    description: "Hummus topped with juicy lamb shawarma.",
    price: 6.95,
    category: "hot-starters",
  },
  {
    name: "Spicy Potato (Batata Harra)",
    description: "Tossed with coriander, garlic & chilli.",
    price: 6.95,
    category: "hot-starters",
    isSpicy: true,
    isVegetarian: true,
    isVegan: true,
  },
  {
    name: "Chicken Wings (6 pcs)",
    description: "Chargrilled with lemon & herbs.",
    price: 6.95,
    category: "hot-starters",
    customizations: [spiceLevelCustomization, sauceCustomization],
  },
  {
    name: "Samosa Lamb",
    description: "Lebanese-style pastry filled with spiced lamb.",
    price: 5.95,
    category: "hot-starters",
  },
  {
    name: "Samosa Veg",
    description: "Crispy pastry filled with vegetable & herbs.",
    price: 5.5,
    category: "hot-starters",
    isVegetarian: true,
    isVegan: true,
  },

  // Main Courses
  {
    name: "Mixed Grill",
    description:
      "Chicken shish, lamb shish, kofta. Served with salad, rice or chips.",
    price: 14.95,
    category: "main-courses",
    isPopular: true,
    customizations: [
      spiceLevelCustomization,
      sideChoice,
      sauceCustomization,
      mainAddOns,
    ],
  },
  {
    name: "Chicken Shish",
    description: "Chargrilled chicken cubes. Served with salad, rice or chips.",
    price: 12.95,
    category: "main-courses",
    isPopular: true,
    customizations: [
      spiceLevelCustomization,
      sideChoice,
      sauceCustomization,
      mainAddOns,
    ],
  },
  {
    name: "Lamb Shish",
    description: "Tender grilled lamb cubes. Served with salad, rice or chips.",
    price: 13.95,
    category: "main-courses",
    customizations: [
      spiceLevelCustomization,
      sideChoice,
      sauceCustomization,
      mainAddOns,
    ],
  },
  {
    name: "Chicken & Lamb Shawarma",
    description:
      "Mixed platter with garlic & tahini sauce. Served with salad, rice or chips.",
    price: 13.95,
    category: "main-courses",
    customizations: [
      spiceLevelCustomization,
      sideChoice,
      sauceCustomization,
      mainAddOns,
    ],
  },
  {
    name: "Lamb Kofta",
    description:
      "Minced lamb skewers with herbs. Served with salad, rice or chips.",
    price: 12.95,
    category: "main-courses",
    customizations: [
      spiceLevelCustomization,
      sideChoice,
      sauceCustomization,
      mainAddOns,
    ],
  },
  {
    name: "Chicken Wings",
    description: "Chargrilled & glazed. Served with salad, rice or chips.",
    price: 12.5,
    category: "main-courses",
    customizations: [spiceLevelCustomization, sideChoice, sauceCustomization],
  },
  {
    name: "Half Boneless Chicken",
    description:
      "Marinated, flame-grilled half chicken (boneless). Served with salad, rice or chips.",
    price: 12.5,
    category: "main-courses",
    customizations: [
      spiceLevelCustomization,
      sideChoice,
      sauceCustomization,
      mainAddOns,
    ],
  },
  {
    name: "Grilled Halloumi & Veg",
    description: "Served with rice or chips.",
    price: 10.95,
    category: "main-courses",
    isVegetarian: true,
    customizations: [sideChoice, sauceCustomization],
  },
  {
    name: "Lamb Chops (3 pcs)",
    description: "Chargrilled to perfection. Served with salad, rice or chips.",
    price: 13.95,
    category: "main-courses",
    customizations: [spiceLevelCustomization, sideChoice, sauceCustomization],
  },
  {
    name: "Whole Grilled Chicken",
    description: "Marinated & flame-grilled.",
    price: 16.95,
    category: "main-courses",
    customizations: [spiceLevelCustomization, sauceCustomization],
  },

  // Wraps & Burgers
  {
    name: "Chicken Shawarma Wrap",
    description: "Marinated chicken, garlic sauce & pickles.",
    price: 8.5,
    category: "wraps-burgers",
    isPopular: true,
    customizations: [spiceLevelCustomization, sauceCustomization, mainAddOns],
  },
  {
    name: "Lamb Shawarma Wrap",
    description: "Tender lamb slices, tahini & pickles.",
    price: 8.95,
    category: "wraps-burgers",
    customizations: [spiceLevelCustomization, sauceCustomization, mainAddOns],
  },
  {
    name: "Mixed Shawarma Wrap",
    description: "Chicken & lamb combo.",
    price: 9.5,
    category: "wraps-burgers",
    customizations: [spiceLevelCustomization, sauceCustomization, mainAddOns],
  },
  {
    name: "Falafel & Halloumi Wrap",
    description: "Veggie favourite with tahini & salad.",
    price: 8.5,
    category: "wraps-burgers",
    isVegetarian: true,
    customizations: [sauceCustomization],
  },
  {
    name: "Chicken Shish Wrap",
    description: "Grilled cubes of chicken breast.",
    price: 8.75,
    category: "wraps-burgers",
    customizations: [spiceLevelCustomization, sauceCustomization, mainAddOns],
  },
  {
    name: "Lamb Shish Wrap",
    description: "Chargrilled lamb cubes.",
    price: 8.95,
    category: "wraps-burgers",
    customizations: [spiceLevelCustomization, sauceCustomization, mainAddOns],
  },
  {
    name: "Chicken Burger",
    description: "Grilled chicken fillet, lettuce & garlic mayo.",
    price: 7.75,
    category: "wraps-burgers",
    customizations: [spiceLevelCustomization, sauceCustomization],
  },
  {
    name: "Beef Burger",
    description: "Chargrilled Lebanese-spiced patty.",
    price: 7.95,
    category: "wraps-burgers",
    customizations: [spiceLevelCustomization, sauceCustomization],
  },
  {
    name: "Vegetarian Burger",
    description: "Falafel or halloumi patty.",
    price: 7.75,
    category: "wraps-burgers",
    isVegetarian: true,
    customizations: [sauceCustomization],
  },

  // Family Platters
  {
    name: "Family Feast (For 2)",
    description: "Mixed grill, rice/chips, bread & 2 drinks.",
    price: 26.95,
    category: "family-platters",
    isPopular: true,
    customizations: [sideChoice, sauceCustomization],
  },
  {
    name: "Family Feast (For 4)",
    description: "Shawarma, mixed grill, 4 dips, rice/chips, bread, 4 drinks.",
    price: 45.95,
    category: "family-platters",
    customizations: [sideChoice, sauceCustomization],
  },
  {
    name: "Shawarma Sharing Box",
    description: "Chicken, lamb or mixed with fries & sauces.",
    price: 24.95,
    category: "family-platters",
    customizations: [
      {
        id: "protein",
        name: "Choose Protein",
        required: true,
        options: [
          { id: "chicken", name: "Chicken", price: 0 },
          { id: "lamb", name: "Lamb", price: 0 },
          { id: "mixed", name: "Mixed", price: 0 },
        ],
      },
      sauceCustomization,
    ],
  },

  // Desserts
  {
    name: "Baklava (4 pcs)",
    description: "Traditional Lebanese pastry.",
    price: 4.5,
    category: "desserts",
    isVegetarian: true,
  },
  {
    name: "Chocolate Fudge Cake",
    description: "Rich chocolate indulgence.",
    price: 5.25,
    category: "desserts",
    isVegetarian: true,
  },
  {
    name: "Cheesecake",
    description: "Light & fruity. Choice of Mango or Strawberry.",
    price: 5.65,
    category: "desserts",
    isVegetarian: true,
    customizations: [
      {
        id: "flavour",
        name: "Choose Flavour",
        required: true,
        options: [
          { id: "mango", name: "Mango", price: 0 },
          { id: "strawberry", name: "Strawberry", price: 0 },
        ],
      },
    ],
  },
  {
    name: "Milk Cake",
    description: "Soft sponge soaked in milk syrup.",
    price: 5.65,
    category: "desserts",
    isVegetarian: true,
  },

  // Drinks
  {
    name: "Coca-Cola / Fanta / Sprite",
    description: "Refreshing soft drink.",
    price: 2.45,
    category: "drinks",
    isVegetarian: true,
    isVegan: true,
    customizations: [
      {
        id: "type",
        name: "Choose Drink",
        required: true,
        options: [
          { id: "coca-cola", name: "Coca-Cola", price: 0 },
          { id: "fanta", name: "Fanta", price: 0 },
          { id: "sprite", name: "Sprite", price: 0 },
        ],
      },
    ],
  },
  {
    name: "Ayran (Yoghurt Drink)",
    description: "Traditional Middle Eastern yoghurt drink.",
    price: 2.75,
    category: "drinks",
    isVegetarian: true,
  },
  {
    name: "Still / Sparkling Water",
    description: "Bottled water.",
    price: 1.95,
    category: "drinks",
    isVegetarian: true,
    isVegan: true,
    customizations: [
      {
        id: "type",
        name: "Choose Type",
        required: true,
        options: [
          { id: "still", name: "Still", price: 0 },
          { id: "sparkling", name: "Sparkling", price: 0 },
        ],
      },
    ],
  },

  // Sides & Extras
  {
    name: "Regular Fries",
    description: "Classic golden fries.",
    price: 2.95,
    category: "sides-extras",
    isVegetarian: true,
    isVegan: true,
  },
  {
    name: "Spicy Fries",
    description: "Tossed with Lebanese chilli & herbs.",
    price: 3.25,
    category: "sides-extras",
    isSpicy: true,
    isVegetarian: true,
    isVegan: true,
  },
  {
    name: "Rice",
    description: "Fragrant Lebanese rice with vermicelli.",
    price: 3.5,
    category: "sides-extras",
    isVegetarian: true,
    isVegan: true,
  },
  {
    name: "Spicy Rice",
    description: "Flavoured with chilli & paprika.",
    price: 3.75,
    category: "sides-extras",
    isSpicy: true,
    isVegetarian: true,
    isVegan: true,
  },
  {
    name: "Garlic Sauce",
    description: "Creamy Lebanese toum dip.",
    price: 1.5,
    category: "sides-extras",
    isVegetarian: true,
  },
  {
    name: "Chilli Sauce",
    description: "Homemade spicy chilli blend.",
    price: 1.5,
    category: "sides-extras",
    isSpicy: true,
    isVegetarian: true,
    isVegan: true,
  },
  {
    name: "Mixed Sauce Pot",
    description: "Garlic, chilli & tahini combo.",
    price: 1.95,
    category: "sides-extras",
    isVegetarian: true,
  },
  {
    name: "Bread (2 pcs)",
    description: "Fresh Lebanese flatbread.",
    price: 2.5,
    category: "sides-extras",
    isVegetarian: true,
    isVegan: true,
  },
  {
    name: "Coleslaw",
    description: "Creamy, crunchy homemade coleslaw.",
    price: 2.5,
    category: "sides-extras",
    isVegetarian: true,
  },
  {
    name: "Mixed Pickles",
    description: "Lebanese-style pickled vegetables.",
    price: 3.25,
    category: "sides-extras",
    isVegetarian: true,
    isVegan: true,
  },
  {
    name: "Extra Halloumi (2 pcs)",
    description: "Grilled cheese upgrade.",
    price: 2.95,
    category: "sides-extras",
    isVegetarian: true,
  },
  {
    name: "Extra Shawarma Chicken",
    description: "Add-on portion.",
    price: 4.5,
    category: "sides-extras",
    isPopular: true,
  },
  {
    name: "Extra Shawarma Lamb",
    description: "Add-on portion.",
    price: 4.95,
    category: "sides-extras",
    isPopular: true,
  },
  {
    name: "Garlic",
    description: "Hand crafted dip.",
    price: 0.9,
    category: "hand-crafted-dips",
    isVegetarian: true,
  },
  {
    name: "Chilli",
    description: "Hand crafted dip.",
    price: 0.9,
    category: "hand-crafted-dips",
    isVegetarian: true,
    isVegan: true,
    isSpicy: true,
  },
  {
    name: "Honey Bang",
    description: "Hand crafted dip.",
    price: 0.9,
    category: "hand-crafted-dips",
    isVegetarian: true,
  },
  {
    name: "Sesame",
    description: "Hand crafted dip.",
    price: 0.9,
    category: "hand-crafted-dips",
    isVegetarian: true,
  },

  // Lunch Deals (Collection Only, Mon–Fri 11:30–16:00)
  {
    name: "Wrap Meal Deal",
    description:
      "Any wrap + Regular Fries + Soft Drink (Can). Collection only.",
    price: 8.95,
    category: "lunch-deals",
    isPopular: true,
    customizations: [
      {
        id: "wrap",
        name: "Choose Wrap",
        required: true,
        options: [
          { id: "chicken-shawarma", name: "Chicken Shawarma", price: 0 },
          { id: "lamb-shawarma", name: "Lamb Shawarma", price: 1 },
          { id: "mixed-shawarma", name: "Mixed Shawarma", price: 1 },
          { id: "chicken-shish", name: "Chicken Shish", price: 0 },
          { id: "falafel-halloumi", name: "Falafel & Halloumi", price: 0 },
        ],
      },
      spiceLevelCustomization,
      sauceCustomization,
      sideUpgrades,
      drinkUpgrades,
    ],
  },
  {
    name: "Flames Lunch Box",
    description: "Protein + Base + Salad + One Sauce. Collection only.",
    price: 9.95,
    category: "lunch-deals",
    customizations: [
      {
        id: "protein",
        name: "Choose Protein",
        required: true,
        options: [
          { id: "chicken-shawarma", name: "Chicken Shawarma", price: 0 },
          { id: "chicken-shish", name: "Chicken Shish", price: 0 },
          { id: "lamb-shawarma", name: "Lamb Shawarma", price: 1 },
          { id: "falafel", name: "Falafel", price: 0 },
        ],
      },
      {
        id: "base",
        name: "Choose Base",
        required: true,
        options: [
          { id: "rice", name: "Rice", price: 0 },
          { id: "spicy-rice", name: "Spicy Rice", price: 0 },
          { id: "fries", name: "Fries", price: 0 },
          { id: "salad", name: "Fresh Salad", price: 0 },
        ],
      },
      sauceCustomization,
      sideUpgrades,
      drinkUpgrades,
    ],
  },
  {
    name: "Small Grill Lunch",
    description:
      "4pc Grill + Rice or Fries + Salad + One Sauce. Collection only.",
    price: 10.95,
    category: "lunch-deals",
    customizations: [
      {
        id: "grill",
        name: "Choose Grill",
        required: true,
        options: [
          { id: "chicken-shish", name: "Chicken Shish (4 pcs)", price: 0 },
          { id: "lamb-kofta", name: "Lamb Kofta (4 pcs)", price: 0 },
        ],
      },
      sideChoice,
      sauceCustomization,
      sideUpgrades,
      drinkUpgrades,
    ],
  },
  {
    name: "Veggie Meal Deal",
    description: "Veggie Wrap + Regular Fries + Soft Drink. Collection only.",
    price: 8.25,
    category: "lunch-deals",
    isVegetarian: true,
    customizations: [
      {
        id: "wrap",
        name: "Choose Wrap",
        required: true,
        options: [
          { id: "falafel", name: "Falafel Wrap", price: 0 },
          { id: "halloumi", name: "Halloumi Wrap", price: 0 },
          {
            id: "falafel-halloumi",
            name: "Falafel & Halloumi Wrap",
            price: 0.75,
          },
        ],
      },
      sauceCustomization,
      sideUpgrades,
      drinkUpgrades,
    ],
  },
  {
    name: "Protein Salad Box",
    description: "Protein + Full Salad Base + One Sauce. Collection only.",
    price: 9.95,
    category: "lunch-deals",
    customizations: [
      {
        id: "protein",
        name: "Choose Protein",
        required: true,
        options: [
          { id: "chicken-shawarma", name: "Chicken Shawarma", price: 0 },
          { id: "chicken-shish", name: "Chicken Shish", price: 0 },
          { id: "falafel", name: "Falafel", price: 0 },
        ],
      },
      sauceCustomization,
      sideUpgrades,
      drinkUpgrades,
    ],
  },
  {
    name: "Flames Shawarma Bowl",
    description:
      "Shawarma + Rice + Pickles + Garlic Sauce + Toasted Flatbread. Collection only.",
    price: 11.95,
    category: "lunch-deals",
    isPopular: true,
    customizations: [
      {
        id: "protein",
        name: "Choose Protein",
        required: true,
        options: [
          { id: "chicken", name: "Chicken Shawarma", price: 0 },
          { id: "lamb", name: "Lamb Shawarma", price: 1 },
        ],
      },
      sideUpgrades,
      drinkUpgrades,
    ],
  },
];

export default menuItems;

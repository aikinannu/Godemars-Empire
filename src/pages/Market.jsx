import React, { useState } from "react";
import {
  ShoppingCart,
  Heart,
  Star,
  Search,
  MoreHorizontal,
} from "lucide-react";
import DesktopSidebar from "../components/DesktopSidebar";
import DesktopQuickNav from "../components/DesktopQuickNav";
import { useAuth } from "../context/AuthContext";
import RequireFeature from "../components/RequireFeature";

const Market = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("trending");
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState([]);

  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Premium Course",
      price: 99,
      rating: 4.8,
      reviews: 234,
      image: "📚",
      category: "courses",
      requiredFeature: "files_vault",
      liked: false,
      seller: "Expert Academy",
      description: "Learn advanced development techniques",
    },
    {
      id: 2,
      name: "Digital Product",
      price: 49,
      rating: 4.5,
      reviews: 156,
      image: "💿",
      category: "digital",
      liked: false,
      seller: "Digital Goods",
      description: "High-quality digital asset",
    },
    {
      id: 3,
      name: "Template Pack",
      price: 29,
      rating: 4.9,
      reviews: 389,
      image: "🎨",
      category: "templates",
      liked: false,
      seller: "Design Studio",
      description: "Professional design templates",
    },
    {
      id: 4,
      name: "E-Book Bundle",
      price: 39,
      rating: 4.6,
      reviews: 145,
      image: "📖",
      category: "ebooks",
      liked: false,
      seller: "Publishing House",
      description: "Complete learning material",
    },
    {
      id: 5,
      name: "Music Pack",
      price: 19,
      rating: 4.7,
      reviews: 278,
      image: "🎵",
      category: "audio",
      liked: false,
      seller: "Sound Creators",
      description: "Royalty-free music collection",
    },
    {
      id: 6,
      name: "Video Effects",
      price: 59,
      rating: 4.4,
      reviews: 167,
      image: "🎬",
      category: "video",
      liked: false,
      seller: "VFX Studio",
      description: "Professional video effects",
    },
    {
      id: 7,
      name: "Code Library",
      price: 35,
      rating: 4.8,
      reviews: 312,
      image: "💻",
      category: "code",
      liked: false,
      seller: "Dev Tools",
      description: "Reusable code components",
    },
    {
      id: 8,
      name: "Icon Set",
      price: 15,
      rating: 4.9,
      reviews: 543,
      image: "⭐",
      category: "design",
      liked: false,
      seller: "Icon Master",
      description: "1000+ scalable icons",
    },
  ]);

  const categories = [
    { id: "all", label: "All Products" },
    { id: "courses", label: "Courses" },
    { id: "templates", label: "Templates" },
    { id: "digital", label: "Digital" },
    { id: "ebooks", label: "E-Books" },
    { id: "audio", label: "Audio" },
    { id: "video", label: "Video" },
    { id: "code", label: "Code" },
    { id: "design", label: "Design" },
  ];

  const toggleLike = (productId) => {
    setProducts(
      products.map((product) =>
        product.id === productId ? { ...product, liked: !product.liked } : product
      )
    );
  };

  const toggleCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(cart.filter((item) => item.id !== product.id));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const renderCard = (product) => (
    <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-600/80 hover:bg-gray-800/60 transition-all duration-200 shadow-lg group">
      <div className="relative w-full aspect-square bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-6xl group-hover:scale-110 transition overflow-hidden">
        {product.image}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 to-transparent" />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">{product.name}</h3>
            <p className="text-xs text-gray-500">{product.seller}</p>
          </div>
          <button className="text-gray-400 hover:text-yellow-400 p-1 transition">
            <MoreHorizontal size={16} />
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-3">{product.description}</p>

        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              className={`${
                i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-600"
              }`}
            />
          ))}
          <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-700/30">
          <span className="text-lg font-bold text-yellow-400">${product.price}</span>
          <div className="flex gap-2">
            <button
              onClick={() => toggleLike(product.id)}
              className={`p-2 rounded-lg transition ${
                product.liked ? "bg-red-500/20 text-red-500" : "bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-red-500"
              }`}
            >
              <Heart size={16} fill={product.liked ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => toggleCart(product)}
              className={`px-3 py-2 rounded-lg transition font-medium text-sm ${
                cart.some((item) => item.id === product.id) ? "bg-yellow-500 text-gray-950 hover:bg-yellow-600" : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              {cart.some((item) => item.id === product.id) ? "In Cart" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto px-2 lg:px-4">
        <div className="lg:grid lg:grid-cols-12 gap-6 pt-6">
          <aside className="hidden lg:block lg:col-span-3 h-fit sticky top-24">
            <div className="rounded-xl overflow-hidden">
              <DesktopSidebar />
            </div>
          </aside>

          <main className="lg:col-span-6 pb-20 md:pb-4">
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Marketplace</h1>
                <button
                  onClick={() => setShowCart(!showCart)}
                  className="relative bg-yellow-500 hover:bg-yellow-600 text-gray-950 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <ShoppingCart size={18} />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>
              <p className="text-gray-400">Discover premium digital products</p>

              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                          selectedCategory === cat.id ? "bg-yellow-500 text-gray-950" : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-yellow-500/50"
                  >
                    <option value="trending">Trending</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedProducts.map((product) => {
                const card = renderCard(product);
                if (product.requiredFeature) {
                  return (
                    <RequireFeature key={product.id} feature={product.requiredFeature}>
                      {card}
                    </RequireFeature>
                  );
                }
                return React.cloneElement(card, { key: product.id });
              })}
            </div>

            {sortedProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No products found</p>
              </div>
            )}
          </main>

          <aside className="lg:col-span-3 hidden lg:block h-fit sticky top-24">
            {showCart ? (
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-4 text-lg">Shopping Cart ({cart.length})</h3>
                {cart.length === 0 ? (
                  <p className="text-gray-400 text-sm">Cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{item.name}</p>
                            <p className="text-xs text-yellow-400">${item.price}</p>
                          </div>
                          <button onClick={() => toggleCart(item)} className="text-gray-400 hover:text-red-500 text-xs">Remove</button>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-700/50 pt-3">
                      <div className="flex justify-between mb-3">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-yellow-400 font-bold">${cartTotal}</span>
                      </div>
                      <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-950 font-semibold py-2 rounded-lg transition">Checkout</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden">
                <DesktopQuickNav />
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Market;

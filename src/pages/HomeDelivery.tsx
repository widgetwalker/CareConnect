import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Truck, Pill, Trash2, CheckCircle2, ArrowRight, Package, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

const MEDICINES = [
    { id: 1, name: "Paracetamol 500mg", type: "Tablet", price: 45, image: "💊", description: "Fever and pain relief", category: "Painkiller" },
    { id: 2, name: "Ibuprofen 400mg", type: "Capsule", price: 85, image: "💊", description: "Anti-inflammatory and pain relief", category: "Painkiller" },
    { id: 3, name: "Amoxicillin 250mg", type: "Tablet", price: 120, image: "💊", description: "Broad-spectrum antibiotic", category: "Antibiotic" },
    { id: 4, name: "Vitamin C 500mg", type: "Chewable", price: 60, image: "🍊", description: "Immunity booster", category: "Supplements" },
    { id: 5, name: "Cough Syrup", type: "Liquid", price: 150, image: "🧪", description: "Dry cough relief", category: "Cold & Flu" },
    { id: 6, name: "Antacid Liquid", type: "Liquid", price: 95, image: "🧪", description: "Quick relief from acidity", category: "Digestion" },
    { id: 7, name: "Cetirizine 10mg", type: "Tablet", price: 30, image: "💊", description: "Anti-allergy medication", category: "Allergy" },
    { id: 8, name: "Hand Sanitizer", type: "Liquid", price: 55, image: "🧴", description: "99.9% germ protection", category: "Hygiene" },
];

const HomeDelivery = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState<any[]>([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const { toast } = useToast();

    const filteredMedicines = MEDICINES.filter(med =>
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const addToCart = (medicine: any) => {
        setCart(prev => [...prev, medicine]);
        toast({
            title: "Added to Cart",
            description: `${medicine.name} has been added to your shopping list.`,
        });
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setIsCheckoutOpen(true);
    };

    const confirmPayment = () => {
        toast({
            title: "Order Confirmed!",
            description: "Your medicines will be delivered within 2 hours. Tracking link sent via SMS.",
        });
        setCart([]);
        setIsCheckoutOpen(false);
    };

    return (
        <div className="min-h-screen pb-20">
            <main className="pt-24 container mx-auto px-4">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl animate-fade-in">
                            Medicine <span className="text-primary italic">Express</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-lg">
                            Reliable home delivery of prescription and over-the-counter medications within 2 hours.
                        </p>
                    </div>

                    <div className="relative group">
                        <Button
                            variant="outline"
                            size="lg"
                            className="relative h-14 px-6 rounded-2xl glass-card border-primary/20 hover:border-primary transition-all duration-300"
                            onClick={() => document.getElementById('cart-section')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            <ShoppingCart className="w-6 h-6 mr-2 text-primary" />
                            <span className="font-bold">My Cart</span>
                            {cart.length > 0 && (
                                <Badge className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-white border-4 border-background animate-pulse">
                                    {cart.length}
                                </Badge>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Search and Features */}
                <div className="grid lg:grid-cols-3 gap-8 mb-16">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="relative glass-card p-2 rounded-2xl border-none shadow-xl">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6" />
                            <Input
                                placeholder="Search for medicines, vitamins, or diagnostic kits..."
                                className="pl-14 h-16 text-lg border-none focus-visible:ring-0 bg-transparent"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {filteredMedicines.map((med, index) => (
                                <Card key={med.id} className="group overflow-hidden border-none glass-card hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 animate-fade-up" style={{ animationDelay: `${index * 50}ms` }}>
                                    <CardContent className="p-0">
                                        <div className="flex items-center p-6 gap-6">
                                            <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">
                                                {med.image}
                                            </div>
                                            <div className="flex-1">
                                                <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-wider text-primary border-primary/20">{med.category}</Badge>
                                                <CardTitle className="text-xl font-bold mb-1">{med.name}</CardTitle>
                                                <p className="text-sm text-muted-foreground mb-4 line-clamp-1">{med.description}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-2xl font-black text-foreground">₹{med.price}</span>
                                                    <Button
                                                        size="sm"
                                                        className="rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                                        onClick={() => addToCart(med)}
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Cart Sidebar */}
                    <div id="cart-section" className="space-y-6">
                        <Card className="border-none glass-card sticky top-24 overflow-hidden shadow-2xl">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="w-5 h-5 text-primary" />
                                    Order Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {cart.length === 0 ? (
                                    <div className="text-center py-12 space-y-4">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-50">
                                            <ShoppingCart className="w-8 h-8" />
                                        </div>
                                        <p className="text-muted-foreground">Your cart is empty</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
                                            {cart.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between group/item">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl">{item.image}</span>
                                                        <div>
                                                            <p className="font-bold text-sm leading-none">{item.name}</p>
                                                            <p className="text-xs text-muted-foreground">{item.type}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold">₹{item.price}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                            onClick={() => removeFromCart(idx)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-border/50">
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Subtotal</span>
                                                <span>₹{totalAmount}</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Delivery Fee</span>
                                                <span className="text-green-600 font-bold uppercase text-xs">Free</span>
                                            </div>
                                            <div className="flex justify-between text-xl font-black pt-2">
                                                <span>Total</span>
                                                <span className="text-primary">₹{totalAmount}</span>
                                            </div>
                                        </div>

                                        <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 group" onClick={handleCheckout}>
                                            {isCheckoutOpen ? "Confirming..." : "Checkout Now"}
                                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>

                                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                            Safe and Secure Payments
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-teal-600/10 border border-primary/20 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Truck className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-bold">Prescription Delivery</h3>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Need to upload a prescription? Our pharmacists will verify it within 15 minutes.
                            </p>
                            <Button variant="link" className="p-0 h-auto text-primary font-bold">Upload Now &rarr;</Button>
                        </div>
                    </div>
                </div>

                {/* Payment Modal Mockup */}
                {isCheckoutOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                        <Card className="max-w-md w-full border-none shadow-2xl glass-card overflow-hidden">
                            <CardHeader className="bg-primary/5 text-center p-8">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CreditCard className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle className="text-2xl font-black">Finalize Payment</CardTitle>
                                <p className="text-muted-foreground mt-2">Securely pay ₹{totalAmount} to confirm order</p>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl border-2 border-primary/20 flex items-center gap-4 cursor-pointer hover:bg-primary/5 transition-colors group">
                                        <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/20 transition-colors">
                                            <div className="w-8 h-8 text-xs font-bold flex items-center justify-center">UPI</div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold">Google Pay / PhonePe</p>
                                            <p className="text-xs text-muted-foreground">Pay using your UPI app</p>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border-2 border-border/50 flex items-center gap-4 cursor-pointer hover:bg-muted transition-colors group">
                                        <div className="p-2 bg-muted rounded-lg">
                                            <CreditCard className="w-8 h-8" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold">Credit / Debit Card</p>
                                            <p className="text-xs text-muted-foreground">All major cards accepted</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button variant="outline" className="h-12 rounded-xl font-bold" onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
                                    <Button className="h-12 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={confirmPayment}>Pay ₹{totalAmount}</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default HomeDelivery;

// Trade Finance Game JavaScript
class TradeFinanceGame {
    constructor() {
        this.gameState = {
            cash: 50000,
            reputation: 10,
            day: 1,
            inventory: {},
            finishedProducts: {},
            orders: [],
            salesOrders: [],
            bankingProducts: [],
            manufacturingOrders: [],
            vendorPayments: [],
            bankruptcyDay: null, // Track when bankruptcy occurs
            outstandingLoans: [], // Track outstanding trade loans
            eventTriggeredToday: false // Prevent multiple events per day
        };
        
        // Initialize current market prices
        this.currentMarketPrices = {};
        
        // Track market opportunity discounts
        this.marketOpportunity = {
            active: false,
            material: null,
            daysRemaining: 0,
            discountFactor: 1.0
        };

        this.rawMaterials = {
            cotton: { name: 'Cotton', basePrice: 2.50, unit: 'lbs' },
            wool: { name: 'Wool', basePrice: 4.20, unit: 'lbs' },
            silk: { name: 'Silk', basePrice: 15.80, unit: 'lbs' }
        };

        this.vendors = {
            cottonVendor: { 
                name: 'Cotton Mills Inc.', 
                location: 'India', 
                reliability: 0.9,
                paymentTerms: 30, // days
                margin: 0.25, // $0.25 per unit margin
                riskLevel: 'Medium'
            },
            woolVendor: { 
                name: 'Highland Wool Co.', 
                location: 'Scotland', 
                reliability: 0.85,
                paymentTerms: 45, // days
                margin: 0.50, // $0.50 per unit margin
                riskLevel: 'Low'
            },
            silkVendor: { 
                name: 'Silk Road Trading', 
                location: 'China', 
                reliability: 0.95,
                paymentTerms: 15, // days
                margin: 0.15, // $0.15 per unit margin
                riskLevel: 'High'
            }
        };

        this.buyers = {
            localRetailer: { 
                name: 'Local Textile Retailer', 
                location: 'Local', 
                reliability: 0.95,
                paymentTerms: 15, // days
                riskLevel: 'Low',
                defaultRisk: 0.05 // 5% chance of default
            },
            regionalDistributor: { 
                name: 'Regional Distribution Co.', 
                location: 'Regional', 
                reliability: 0.90,
                paymentTerms: 30, // days
                riskLevel: 'Low',
                defaultRisk: 0.10 // 10% chance of default
            },
            nationalChain: { 
                name: 'National Retail Chain', 
                location: 'National', 
                reliability: 0.85,
                paymentTerms: 45, // days
                riskLevel: 'Medium',
                defaultRisk: 0.15 // 15% chance of default
            },
            europeanBuyer: { 
                name: 'European Textile Import', 
                location: 'Europe', 
                reliability: 0.75,
                paymentTerms: 60, // days
                riskLevel: 'High',
                defaultRisk: 0.25 // 25% chance of default
            },
            asianBuyer: { 
                name: 'Asian Trading Company', 
                location: 'Asia', 
                reliability: 1.0,
                paymentTerms: 0, // days - cash terms
                riskLevel: 'None',
                defaultRisk: 0.0 // 0% chance of default
            }
        };

        this.products = {
            cottonFabric: { 
                name: 'Cotton Fabric', 
                materials: { cotton: 2 }, 
                price: 11.25, 
                unit: 'yards',
                baseMargin: 1.70, // $1.70 per unit base margin (reduced by 15%)
                manufacturingDays: 2, // 2 days to manufacture
                manufacturingCost: 1.50 // $1.50 per unit manufacturing cost
            },
            woolFabric: { 
                name: 'Wool Fabric', 
                materials: { wool: 2.0 }, 
                price: 20.25, 
                unit: 'yards',
                baseMargin: 3.40, // $3.40 per unit base margin (reduced by 15%)
                manufacturingDays: 3, // 3 days to manufacture
                manufacturingCost: 2.50 // $2.50 per unit manufacturing cost
            },
            syntheticFabric: { 
                name: 'Synthetic Fabric', 
                materials: { wool: 2.0, silk: 1.0 }, 
                price: 36.00, 
                unit: 'yards',
                baseMargin: 6.80, // $6.80 per unit base margin (reduced by 15%)
                manufacturingDays: 5, // 5 days to manufacture
                manufacturingCost: 8.00 // $8.00 per unit manufacturing cost
            }
        };

        this.bankingServices = {
            tradeLoan: {
                name: 'Trade Loan',
                description: 'Short-term financing for inventory purchases (30-90 days)',
                cost: 0.06, // 6% interest rate
                requirements: { reputation: 40, cash: 2000 }
            },
            factoring: {
                name: 'Factoring',
                description: 'Sell accounts receivable for immediate cash',
                cost: 0.05, // 5% fee
                requirements: { reputation: 35, cash: 1500 }
            }
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.generateMarketPrices();
        this.addEvent('Welcome', 'Welcome to your new textile business! You have $50,000 in startup capital. Your objective is to grow your business to hit $1,000,000 in revenue within 365 days. Use various trade finance banking products to achieve this goal.');
    }

    setupEventListeners() {
        // Modal controls
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Action buttons
        document.getElementById('newOrderBtn').addEventListener('click', () => {
            this.openOrderModal();
        });

        document.getElementById('manufactureBtn').addEventListener('click', () => {
            this.openManufactureModal();
        });

        document.getElementById('salesBtn').addEventListener('click', () => {
            this.openSalesModal();
        });

        document.getElementById('visitBankBtn').addEventListener('click', () => {
            this.openBankModal();
        });

        document.getElementById('nextDayBtn').addEventListener('click', () => {
            this.nextDay();
        });

        document.getElementById('tutorialBtn').addEventListener('click', () => {
            this.openTutorialModal();
        });

        // Form submissions
        document.getElementById('orderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processOrder();
        });

        document.getElementById('manufactureForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processManufacturing();
        });

        document.getElementById('salesForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processSales();
        });

        // Update buyer options when product is selected
        document.getElementById('salesProduct').addEventListener('change', (e) => {
            this.updateBuyerOptions(e.target.value);
        });

        // Update vendor options when material is selected
        document.getElementById('product').addEventListener('change', (e) => {
            this.updateVendorOptions(e.target.value);
        });

        // Show/hide tenor field when financing method changes
        document.getElementById('financingMethod').addEventListener('change', (e) => {
            this.updateTenorField(e.target.value);
        });

        // Update manufacturing capacity when product is selected
        document.getElementById('manufactureProduct').addEventListener('change', (e) => {
            this.updateManufacturingCapacity(e.target.value);
        });

        // Market price clicks
        document.getElementById('marketPrices').addEventListener('click', (e) => {
            if (e.target.closest('.market-item')) {
                this.openOrderModal();
            }
        });
    }

    updateDisplay() {
        // Update cash display with red color for negative values
        const cashElement = document.getElementById('cash');
        cashElement.textContent = `$${this.gameState.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        cashElement.style.color = this.gameState.cash < 0 ? '#dc2626' : 'white';
        
        // Update reputation
        document.getElementById('reputation').textContent = this.gameState.reputation;
        
        // Update day display with bankruptcy deadline if applicable
        const dayElement = document.getElementById('day');
        const daysRemaining = 366 - this.gameState.day; // 365 days total, so 366 - current day
        const daysRemainingText = daysRemaining > 0 ? ` (${daysRemaining} days left)` : ' (Objectives Complete!)';
        
        if (this.gameState.bankruptcyDay) {
            const bankruptcyRemaining = this.gameState.bankruptcyDay - this.gameState.day;
            dayElement.innerHTML = `Day ${this.gameState.day} <span style="color: #dc2626; font-size: 0.8em;">(Bankruptcy: Day ${this.gameState.bankruptcyDay}, ${bankruptcyRemaining} days left)</span><span style="color: #667eea; font-size: 0.8em;">${daysRemainingText}</span>`;
        } else {
            dayElement.innerHTML = `Day ${this.gameState.day}<span style="color: #667eea; font-size: 0.8em;">${daysRemainingText}</span>`;
        }

        this.updateInventory();
        this.updateManufacturingOrders();
        this.updateFinishedProducts();
        this.updateOrders();
        this.updateSalesOrders();
        this.updateOutstandingLoans();
    }

    updateInventory() {
        const inventoryDiv = document.getElementById('inventory');
        inventoryDiv.innerHTML = '';

        if (Object.keys(this.gameState.inventory).length === 0) {
            inventoryDiv.innerHTML = '<p style="color: #718096; font-style: italic;">No raw materials in inventory</p>';
            return;
        }

        Object.entries(this.gameState.inventory).forEach(([material, quantity]) => {
            const item = document.createElement('div');
            item.className = 'inventory-item';
            item.innerHTML = `
                <h4>${this.rawMaterials[material].name}</h4>
                <p>Quantity: ${this.formatNumber(quantity)} ${this.rawMaterials[material].unit}</p>
            `;
            inventoryDiv.appendChild(item);
        });
    }

    updateManufacturingOrders() {
        const manufacturingDiv = document.getElementById('manufacturingOrders');
        manufacturingDiv.innerHTML = '';

        if (this.gameState.manufacturingOrders.length === 0) {
            manufacturingDiv.innerHTML = '<p style="color: #718096; font-style: italic;">No active manufacturing</p>';
            return;
        }

        this.gameState.manufacturingOrders.forEach((order, index) => {
            const productData = this.products[order.product];
            const daysRemaining = order.completionDay - this.gameState.day;
            
            const item = document.createElement('div');
            item.className = 'order-item';
            
            // Add visual styling to distinguish from other sections
            item.style.background = '#f0f9ff'; // Light blue background
            item.style.borderLeftColor = '#3b82f6'; // Blue left border
            
            item.innerHTML = `
                <h4>${productData.name}</h4>
                <p>Quantity: ${this.formatNumber(order.quantity)} ${productData.unit}</p>
                <p style="color: ${daysRemaining > 0 ? '#059669' : '#dc2626'}; font-weight: 600;">
                    ${daysRemaining > 0 ? `⏳ Completes: Day ${order.completionDay} (${daysRemaining} days)` : `✅ Completes Today!`}
                </p>
                <p>Production Cost: $${order.manufacturingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            `;
            manufacturingDiv.appendChild(item);
        });
    }

    updateFinishedProducts() {
        const productsDiv = document.getElementById('finishedProducts');
        productsDiv.innerHTML = '';

        if (Object.keys(this.gameState.finishedProducts).length === 0) {
            productsDiv.innerHTML = '<p style="color: #718096; font-style: italic;">No finished products</p>';
            return;
        }

        Object.entries(this.gameState.finishedProducts).forEach(([product, quantity]) => {
            const item = document.createElement('div');
            item.className = 'inventory-item';
            item.innerHTML = `
                <h4>${this.products[product].name}</h4>
                <p>Quantity: ${this.formatNumber(quantity)} ${this.products[product].unit}</p>
            `;
            productsDiv.appendChild(item);
        });
    }

    updateOrders() {
        const ordersDiv = document.getElementById('orders');
        ordersDiv.innerHTML = '';

        if (this.gameState.orders.length === 0) {
            ordersDiv.innerHTML = '<p style="color: #718096; font-style: italic;">No pending orders</p>';
            return;
        }

        this.gameState.orders.forEach((order, index) => {
            const item = document.createElement('div');
            item.className = 'order-item';
            
            // Determine order status
            let status = '';
            if (order.arrivalDay > this.gameState.day) {
                status = `Arrives: Day ${order.arrivalDay}`;
            } else if (order.paymentDueDay > this.gameState.day) {
                status = `Arrived - Payment Due: Day ${order.paymentDueDay}`;
            } else {
                status = `Payment Due Today!`;
            }
            
            item.innerHTML = `
                <h4>${this.rawMaterials[order.material].name}</h4>
                <p>Quantity: ${this.formatNumber(order.quantity)} ${this.rawMaterials[order.material].unit}</p>
                <p>Vendor: ${this.vendors[order.vendor].name}</p>
                <p>Price: $${order.pricePerLb.toFixed(2)}/${this.rawMaterials[order.material].unit}</p>
                <p>Cost: $${order.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p>Status: ${status}</p>
                <p>Payment Terms: ${order.paymentTerms} days</p>
            `;
            ordersDiv.appendChild(item);
        });
    }

    updateSalesOrders() {
        const salesDiv = document.getElementById('salesOrders');
        salesDiv.innerHTML = '';

        if (this.gameState.salesOrders.length === 0) {
            salesDiv.innerHTML = '<p style="color: #718096; font-style: italic;">No sales orders</p>';
            return;
        }

        this.gameState.salesOrders.forEach((order, index) => {
            const item = document.createElement('div');
            item.className = 'order-item';
            
            // Determine sales order status
            let status = '';
            if (order.completionDay > this.gameState.day) {
                status = `Completes: Day ${order.completionDay}`;
            } else if (order.paymentDueDay > this.gameState.day) {
                status = `Completed - Payment Due: Day ${order.paymentDueDay}`;
            } else {
                status = `Payment Due Today!`;
            }
            
            item.innerHTML = `
                <h4>${this.products[order.product].name}</h4>
                <p>Quantity: ${this.formatNumber(order.quantity)} ${this.products[order.product].unit}</p>
                <p>Buyer: ${this.buyers[order.buyer].name} (${this.buyers[order.buyer].location})</p>
                <p>Base Price: $${order.basePrice.toFixed(2)}/${this.products[order.product].unit}</p>
                <p>Unit Price: $${order.unitPrice.toFixed(2)}/${this.products[order.product].unit}</p>
                <p>Revenue: $${order.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p>Status: ${status}</p>
                <p>Payment Terms: ${order.paymentTerms} days</p>
            `;
            salesDiv.appendChild(item);
        });
    }

    updateOutstandingLoans() {
        const loansDiv = document.getElementById('loansList');
        loansDiv.innerHTML = '';

        if (this.gameState.outstandingLoans.length === 0) {
            loansDiv.innerHTML = '<p style="color: #718096; font-style: italic;">No outstanding loans</p>';
            return;
        }

        // Add loan count header
        const countHeader = document.createElement('div');
        countHeader.style.cssText = 'margin-bottom: 10px; padding: 8px; background: #f0f4ff; border-radius: 6px; font-weight: 600; color: #2d3748; font-size: 0.9rem;';
        countHeader.innerHTML = `📊 Active Loans: ${this.gameState.outstandingLoans.length}/5`;
        if (this.gameState.outstandingLoans.length >= 5) {
            countHeader.style.background = '#fef2f2';
            countHeader.style.color = '#dc2626';
        } else if (this.gameState.outstandingLoans.length >= 4) {
            countHeader.style.background = '#fffbeb';
            countHeader.style.color = '#f59e0b';
        }
        loansDiv.appendChild(countHeader);

        this.gameState.outstandingLoans.forEach((loan, index) => {
            const daysRemaining = loan.repaymentDay - this.gameState.day;
            const item = document.createElement('div');
            item.className = 'order-item';
            
            const loanType = loan.type === 'factoring' ? 'Factoring Interest' : 'Trade Loan';
            const loanNumber = loan.type === 'factoring' ? `#${index + 1}` : `#${index + 1}`;
            
            item.innerHTML = `
                <h4>${loanType} ${loanNumber}</h4>
                <p><strong>Principal:</strong> $${loan.principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p><strong>Interest Rate:</strong> ${(loan.interestRate * 100).toFixed(1)}%</p>
                <p><strong>Repayment Due:</strong> Day ${loan.repaymentDay} (${daysRemaining} days remaining)</p>
                <p><strong>Total Amount Due:</strong> $${loan.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p style="color: ${daysRemaining <= 0 ? '#dc2626' : daysRemaining <= 7 ? '#f59e0b' : '#10b981'}">
                    ${daysRemaining <= 0 ? 'OVERDUE' : daysRemaining <= 7 ? 'Due Soon' : 'Active'}
                </p>
            `;
            loansDiv.appendChild(item);
        });
    }

    generateMarketPrices() {
        const pricesDiv = document.getElementById('marketPrices');
        pricesDiv.innerHTML = '';

        // Store current market prices for vendor pricing
        if (!this.currentMarketPrices) {
            this.currentMarketPrices = {};
        }

        // Check for market opportunities (5% chance)
        const shouldTriggerMarketOpportunity = Math.random() < 0.05 && !this.marketOpportunity.active;
        if (shouldTriggerMarketOpportunity) {
            this.triggerMarketOpportunity();
        }

        // Process market opportunity countdown
        if (this.marketOpportunity.active) {
            if (this.marketOpportunity.daysRemaining > 0) {
                this.marketOpportunity.daysRemaining--;
                if (this.marketOpportunity.daysRemaining <= 0) {
                    this.endMarketOpportunity();
                }
            }
        }

        Object.entries(this.rawMaterials).forEach(([key, material]) => {
            // Use a smaller price variation to be closer to sourcing prices
            const priceVariation = 0.95 + Math.random() * 0.1; // 95% to 105% of base price
            let currentPrice = material.basePrice * priceVariation;
            
            // Apply market opportunity discount if active for this material
            if (this.marketOpportunity.active && this.marketOpportunity.material === key) {
                currentPrice *= this.marketOpportunity.discountFactor;
            }
            
            // Store the current market price for this material
            this.currentMarketPrices[key] = currentPrice;
            
            const item = document.createElement('div');
            item.className = 'market-item';
            const opportunityIndicator = this.marketOpportunity.active && this.marketOpportunity.material === key 
                ? `<div style="color: #059669; font-size: 0.8rem; font-weight: bold;">🔥 MATERIAL DISCOUNT (${this.marketOpportunity.daysRemaining} days left)</div>`
                : '';
            
            item.innerHTML = `
                <h4>${material.name}</h4>
                <div class="price">$${currentPrice.toFixed(2)}/${material.unit}</div>
                ${opportunityIndicator}
                <div class="vendor">Various suppliers</div>
            `;
            pricesDiv.appendChild(item);
        });
    }


    openOrderModal() {
        const modal = document.getElementById('orderModal');
        const productSelect = document.getElementById('product');
        const vendorSelect = document.getElementById('vendor');

        // Populate product options
        productSelect.innerHTML = '<option value="">Select Raw Material</option>';
        Object.entries(this.rawMaterials).forEach(([key, material]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = material.name;
            productSelect.appendChild(option);
        });

        // Initialize vendor options (will be updated when material is selected)
        vendorSelect.innerHTML = '<option value="">Select Vendor</option>';

        modal.style.display = 'block';
    }

    openManufactureModal() {
        const modal = document.getElementById('manufactureModal');
        const productSelect = document.getElementById('manufactureProduct');
        const productInfo = document.getElementById('productInfo');

        // Populate product options
        productSelect.innerHTML = '<option value="">Select Product</option>';
        Object.entries(this.products).forEach(([key, product]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = product.name;
            productSelect.appendChild(option);
        });

        // Show product information
        productInfo.innerHTML = '';
        Object.entries(this.products).forEach(([key, product]) => {
            const info = document.createElement('div');
            info.innerHTML = `
                <strong>${product.name}:</strong> 
                ${Object.entries(product.materials).map(([mat, qty]) => 
                    `${qty} ${this.rawMaterials[mat].unit} ${this.rawMaterials[mat].name}`
                ).join(', ')} → $${product.price}/unit<br>
                <small>Manufacturing: ${product.manufacturingDays} days, $${product.manufacturingCost.toFixed(2)}/unit cost</small>
            `;
            productInfo.appendChild(info);
        });

        modal.style.display = 'block';
    }

    openSalesModal() {
        const modal = document.getElementById('salesModal');
        const productSelect = document.getElementById('salesProduct');
        const financingSelect = document.getElementById('salesFinancingMethod');

        // Populate product options
        productSelect.innerHTML = '<option value="">Select Product</option>';
        Object.entries(this.gameState.finishedProducts).forEach(([key, quantity]) => {
            if (quantity > 0) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = `${this.products[key].name} (${this.formatNumber(quantity)} available)`;
                productSelect.appendChild(option);
            }
        });

        // Update financing options based on loan limit
        financingSelect.innerHTML = '<option value="">Select Financing</option>';
        financingSelect.innerHTML += '<option value="cash">Cash Payment</option>';
        
        if (this.gameState.outstandingLoans.length < 5) {
            financingSelect.innerHTML += '<option value="factoring">Factoring</option>';
        } else {
            // Add disabled option to show factoring is unavailable
            const factoringOption = document.createElement('option');
            factoringOption.value = '';
            factoringOption.textContent = 'Factoring (Loans at Maximum: 5/5)';
            factoringOption.disabled = true;
            financingSelect.appendChild(factoringOption);
        }

        // Initialize buyer options (will be updated when product is selected)
        this.updateBuyerOptions('');

        modal.style.display = 'block';
    }

    updateBuyerOptions(selectedProduct) {
        const buyerSelect = document.getElementById('salesBuyer');
        buyerSelect.innerHTML = '<option value="">Select Buyer</option>';
        
        if (!selectedProduct) {
            // Show average margins when no product is selected
            Object.entries(this.buyers).forEach(([key, buyer]) => {
                const option = document.createElement('option');
                option.value = key;
                const paymentText = buyer.paymentTerms === 0 ? 'Cash' : `${buyer.paymentTerms} days`;
                option.textContent = `${buyer.name} (${buyer.location}) - ${paymentText}`;
                buyerSelect.appendChild(option);
            });
            return;
        }

        const productData = this.products[selectedProduct];
        
        Object.entries(this.buyers).forEach(([key, buyer]) => {
            const option = document.createElement('option');
            option.value = key;
            
            // Calculate price based on manufacturing price and credit terms
            let pricePerUnit = productData.price; // Exact manufacturing price for 30-day terms
            
            // Credit term adjustments: 30 days = exact manufacturing price
            if (buyer.paymentTerms === 0) {
                pricePerUnit *= 0.80; // 20% discount for cash payment (zero risk)
            } else if (buyer.paymentTerms <= 15) {
                pricePerUnit *= 0.90; // 10% discount for very short terms
            } else if (buyer.paymentTerms <= 30) {
                pricePerUnit *= 1.0; // Exact manufacturing price for 30-day terms
            } else if (buyer.paymentTerms <= 45) {
                pricePerUnit *= 1.05; // 5% premium for longer terms
            } else if (buyer.paymentTerms <= 60) {
                pricePerUnit *= 1.10; // 10% premium for extended terms
            } else {
                pricePerUnit *= 1.15; // 15% premium for very long terms
            }
            const paymentText = buyer.paymentTerms === 0 ? 'Cash' : `${buyer.paymentTerms} days`;
            option.textContent = `${buyer.name} (${buyer.location}) - ${paymentText}, $${pricePerUnit.toFixed(2)}/unit`;
            buyerSelect.appendChild(option);
        });
    }

    updateVendorOptions(selectedMaterial) {
        const vendorSelect = document.getElementById('vendor');
        vendorSelect.innerHTML = '<option value="">Select Vendor</option>';
        
        if (!selectedMaterial) {
            return;
        }

        const materialData = this.rawMaterials[selectedMaterial];
        
        // Get current market price, fallback to base price if not available
        const marketPrice = this.currentMarketPrices ? this.currentMarketPrices[selectedMaterial] : materialData.basePrice;
        
        Object.entries(this.vendors).forEach(([key, vendor]) => {
            const option = document.createElement('option');
            option.value = key;
            
            // Calculate price per lb based on credit terms, using current market price as base
            let pricePerLb = marketPrice;
            
            // Apply credit term adjustments to market price
            // Faster payment = lower price (vendor gets cash sooner)
            if (vendor.paymentTerms <= 15) {
                pricePerLb *= 0.90; // 10% discount for immediate/short payment
            } else if (vendor.paymentTerms <= 30) {
                pricePerLb *= 1.0; // Base market price for 30-day terms
            } else if (vendor.paymentTerms <= 45) {
                pricePerLb *= 1.10; // 10% markup for longer terms (financing cost)
            } else if (vendor.paymentTerms <= 60) {
                pricePerLb *= 1.15; // 15% markup for extended terms
            } else {
                pricePerLb *= 1.25; // 25% markup for very long terms (higher financing cost)
            }
            
            // Add market volatility factor
            const volatilityFactor = 0.98 + Math.random() * 0.04; // ±2% random variation
            pricePerLb *= volatilityFactor;
            
            option.textContent = `${vendor.name} (${vendor.location}) - ${vendor.paymentTerms} days, $${pricePerLb.toFixed(2)}/lb`;
            vendorSelect.appendChild(option);
        });
    }

    updateManufacturingCapacity(selectedProduct) {
        const quantityInput = document.getElementById('manufactureQuantity');
        const capacityInfo = document.getElementById('manufacturingCapacity');
        
        if (!selectedProduct) {
            quantityInput.placeholder = 'Enter quantity';
            if (capacityInfo) {
                capacityInfo.innerHTML = '';
            }
            return;
        }

        const productData = this.products[selectedProduct];
        let maxQuantity = Infinity;
        let limitingMaterial = '';

        // Calculate maximum quantity based on available inventory
        Object.entries(productData.materials).forEach(([material, requiredQty]) => {
            const availableQty = this.gameState.inventory[material] || 0;
            const possibleQuantity = Math.floor(availableQty / requiredQty);
            
            if (possibleQuantity < maxQuantity) {
                maxQuantity = possibleQuantity;
                limitingMaterial = this.rawMaterials[material].name;
            }
        });

        // Update quantity input placeholder and max
        if (maxQuantity === Infinity || maxQuantity === 0) {
            quantityInput.placeholder = 'No materials available';
            quantityInput.max = 0;
        } else {
            quantityInput.placeholder = `Max: ${this.formatNumber(maxQuantity)}`;
            quantityInput.max = maxQuantity;
        }

        // Show capacity information
        if (capacityInfo) {
            if (maxQuantity === 0) {
                capacityInfo.innerHTML = '<p style="color: #e53e3e; font-size: 0.9rem; margin-top: 5px;">❌ Insufficient materials to manufacture this product</p>';
            } else if (maxQuantity < Infinity) {
                capacityInfo.innerHTML = `<p style="color: #48bb78; font-size: 0.9rem; margin-top: 5px;">✅ Can manufacture up to ${this.formatNumber(maxQuantity)} units (limited by ${limitingMaterial})</p>`;
            } else {
                capacityInfo.innerHTML = '<p style="color: #48bb78; font-size: 0.9rem; margin-top: 5px;">✅ Unlimited manufacturing capacity</p>';
            }
        }
    }

    updateTenorField(financingMethod) {
        const tenorGroup = document.getElementById('tenorGroup');
        const tenorSelect = document.getElementById('tenor');
        
        if (financingMethod === 'tradeLoan') {
            // Check if loan limit is reached
            const loanLimitReached = this.gameState.outstandingLoans.length >= 5;
            const canUseTradeLoan = this.gameState.reputation >= this.bankingServices.tradeLoan.requirements.reputation && !loanLimitReached;
            
            if (canUseTradeLoan) {
                tenorGroup.style.display = 'block';
                tenorSelect.required = true;
                
                // Populate tenor options (30, 60, 90 days - maximum 90 days)
                tenorSelect.innerHTML = '<option value="">Select Tenor</option>';
                const tenorOptions = [30, 60, 90];
                tenorOptions.forEach(days => {
                    const option = document.createElement('option');
                    option.value = days;
                    option.textContent = `${days} days`;
                    tenorSelect.appendChild(option);
                });
            } else {
                tenorGroup.style.display = 'block';
                tenorSelect.required = false;
                tenorSelect.innerHTML = '<option value="">Select Tenor</option>';
                tenorSelect.disabled = true;
                
                // Add requirement message
                let requirementMsg = document.getElementById('tradeLoanRequirement');
                if (!requirementMsg) {
                    requirementMsg = document.createElement('div');
                    requirementMsg.id = 'tradeLoanRequirement';
                    requirementMsg.style.color = '#dc2626';
                    requirementMsg.style.fontSize = '0.9rem';
                    requirementMsg.style.marginTop = '5px';
                    tenorGroup.appendChild(requirementMsg);
                }
                
                if (loanLimitReached) {
                    requirementMsg.innerHTML = `❌ Maximum of 5 outstanding loans reached. Current: ${this.gameState.outstandingLoans.length}/5`;
                } else {
                    requirementMsg.innerHTML = `❌ Trade loan requires ${this.bankingServices.tradeLoan.requirements.reputation} reputation. Current: ${this.gameState.reputation}`;
                }
            }
        } else {
            tenorGroup.style.display = 'none';
            tenorSelect.required = false;
            tenorSelect.innerHTML = '<option value="">Select Tenor</option>';
            tenorSelect.disabled = false;
            
            // Remove requirement message
            const requirementMsg = document.getElementById('tradeLoanRequirement');
            if (requirementMsg) {
                requirementMsg.remove();
            }
        }
    }

    openBankModal() {
        const modal = document.getElementById('bankModal');
        const servicesDiv = document.getElementById('bankingServices');

        servicesDiv.innerHTML = '';
        Object.entries(this.bankingServices).forEach(([key, service]) => {
            const canUse = this.canUseBankingService(service);
            const serviceDiv = document.createElement('div');
            serviceDiv.className = 'banking-service';
            serviceDiv.innerHTML = `
                <h4>${service.name}</h4>
                <p>${service.description}</p>
                <p><strong>Current Rate:</strong> ${(service.cost * 100).toFixed(2)}% of transaction value</p>
                <p><strong>Requirements:</strong> Reputation ${service.requirements.reputation}+, Cash $${service.requirements.cash.toLocaleString('en-US')}+</p>
                <button ${!canUse ? 'disabled' : ''} onclick="game.useBankingService('${key}')">
                    ${canUse ? 'Use Service' : 'Requirements Not Met'}
                </button>
            `;
            servicesDiv.appendChild(serviceDiv);
        });

        modal.style.display = 'block';
    }

    openTutorialModal() {
        const modal = document.getElementById('tutorialModal');
        const contentDiv = document.getElementById('tutorialContent');

        contentDiv.innerHTML = `
            <h4>How to Play</h4>
            <p>Welcome to the Trade Finance Business Simulator! This game teaches you about international trade and banking products.</p>
            
            <h4>Game Objectives</h4>
            <ul>
                <li>Achieve $1 million in revenue within 365 days</li>
                <li>Grow your textile business</li>
                <li>Learn about trade finance instruments</li>
                <li>Manage cash flow and reputation</li>
                <li>Make profitable trading decisions</li>
            </ul>

            <h4>Basic Gameplay</h4>
            <ol>
                <li><strong>Source Materials:</strong> Import raw materials from international vendors</li>
                <li><strong>Manufacture:</strong> Convert raw materials into finished textile products</li>
                <li><strong>Sell Products:</strong> Export finished goods to international buyers</li>
                <li><strong>Use Banking Services:</strong> Leverage trade finance products to optimize cash flow</li>
                <li><strong>Next Day:</strong> Advance time and process pending orders</li>
            </ol>

            <h4>Trade Finance Products</h4>
            <ul>
                <li><strong>Trade Loan:</strong> Short-term financing for inventory (30, 60, or 90 days)</li>
                <li><strong>Factoring:</strong> Sell receivables for immediate cash</li>
            </ul>

            <h4>Tips for Success</h4>
            <ul>
                <li>Monitor market prices and buy low</li>
                <li>Use banking products to manage cash flow</li>
                <li>Build reputation with reliable trading partners</li>
                <li>Manage cost and profit margins by trading and selling different products</li>
                <li>Lookout for market opportunity and business event updates</li>
            </ul>
        `;

        modal.style.display = 'block';
    }

    showGuideItemAttachments(itemType) {
        const modal = document.getElementById('guideItemModal');
        const titleDiv = document.getElementById('guideItemTitle');
        const attachedDiv = document.getElementById('attachedDocuments');

        let title;
        
        if (itemType === 'factoring') {
            title = 'Factoring Documents';
        } else if (itemType === 'tradeLoan') {
            title = 'Trade Loan Documents';
        }

        titleDiv.textContent = title;
        
        // Show attached documents for this item type
        this.showAttachedDocuments(itemType, attachedDiv);

        modal.style.display = 'block';
    }

    attachGuideItemDocument() {
        const fileInput = document.getElementById('guideItemAttachment');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a file to attach.');
            return;
        }
        
        // Store the attachment (in a real app, this would be saved to a database)
        if (!this.gameState.guideAttachments) {
            this.gameState.guideAttachments = {};
        }
        
        const currentItem = this.getCurrentGuideItem();
        if (!this.gameState.guideAttachments[currentItem]) {
            this.gameState.guideAttachments[currentItem] = [];
        }
        
        this.gameState.guideAttachments[currentItem].push({
            name: file.name,
            size: file.size,
            type: file.type,
            date: new Date().toLocaleDateString()
        });
        
        alert(`Document "${file.name}" has been attached to ${currentItem}.`);
        
        // Refresh the attached documents display
        this.showAttachedDocuments(currentItem, document.getElementById('attachedDocuments'));
        
        // Clear the file input
        fileInput.value = '';
    }

    getCurrentGuideItem() {
        const title = document.getElementById('guideItemTitle').textContent;
        if (title.includes('Factoring')) return 'factoring';
        if (title.includes('Trade Loan')) return 'tradeLoan';
        return 'unknown';
    }

    showAttachedDocuments(itemType, container) {
        if (!this.gameState.guideAttachments || !this.gameState.guideAttachments[itemType]) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #718096;">
                    <i class="fas fa-file-alt" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;"></i>
                    <p style="font-style: italic; font-size: 1.2rem; margin-bottom: 10px;">No documents available</p>
                    <p style="font-size: 1rem; opacity: 0.8;">Documents will appear here when attached</p>
                </div>
            `;
            return;
        }
        
        const documents = this.gameState.guideAttachments[itemType];
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="margin-bottom: 20px; text-align: center;">
                    <h4 style="color: #2d3748; margin-bottom: 5px;">
                        <i class="fas fa-paperclip"></i> Available Documents
                    </h4>
                    <p style="color: #718096; font-size: 0.9rem;">${documents.length} document${documents.length !== 1 ? 's' : ''} found</p>
                </div>
                ${documents.map(doc => `
                    <div style="padding: 20px; background: white; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid #667eea; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <i class="fas fa-file-alt" style="color: #667eea; font-size: 1.5rem;"></i>
                            <div style="flex: 1;">
                                <strong style="color: #2d3748; font-size: 1.1rem; display: block; margin-bottom: 5px;">${doc.name}</strong>
                                <small style="color: #718096;">Size: ${(doc.size / 1024).toFixed(1)} KB | Date: ${doc.date}</small>
                            </div>
                            <i class="fas fa-download" style="color: #667eea; font-size: 1.2rem; opacity: 0.7;"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    processOrder() {
        const form = document.getElementById('orderForm');
        const formData = new FormData(form);
        
        const material = document.getElementById('product').value;
        const vendor = document.getElementById('vendor').value;
        const quantity = parseInt(document.getElementById('quantity').value);
        const financingMethod = document.getElementById('financingMethod').value;
        const tenor = document.getElementById('tenor').value;

        if (!material || !vendor || !quantity || !financingMethod) {
            alert('Please fill in all fields');
            return;
        }

        // If trade loan is selected, tenor is required
        if (financingMethod === 'tradeLoan' && !tenor) {
            alert('Please select a repayment tenor for the trade loan');
            return;
        }

        // Check if maximum active orders limit is reached
        if (this.gameState.orders.length >= 3) {
            alert('Maximum of 3 active sourcing orders allowed');
            return;
        }

        // Advance day only when order is actually placed
        this.advanceDay('Source Materials');

        const materialData = this.rawMaterials[material];
        const vendorData = this.vendors[vendor];
        
        // Calculate price per lb based on current market price and credit terms
        const marketPrice = this.currentMarketPrices ? this.currentMarketPrices[material] : materialData.basePrice;
        let pricePerLb = marketPrice;
        
        // Apply credit term adjustments to market price (same logic as display)
        // Faster payment = lower price (vendor gets cash sooner)
        if (vendorData.paymentTerms <= 15) {
            pricePerLb *= 0.90; // 10% discount for immediate/short payment
        } else if (vendorData.paymentTerms <= 30) {
            pricePerLb *= 1.0; // Base market price for 30-day terms
        } else if (vendorData.paymentTerms <= 45) {
            pricePerLb *= 1.10; // 10% markup for longer terms (financing cost)
        } else if (vendorData.paymentTerms <= 60) {
            pricePerLb *= 1.15; // 15% markup for extended terms
        } else {
            pricePerLb *= 1.25; // 25% markup for very long terms (higher financing cost)
        }
        
        // Add market volatility factor (same as display)
        const volatilityFactor = 0.98 + Math.random() * 0.04; // ±2% random variation
        pricePerLb *= volatilityFactor;
        
        const totalCost = quantity * pricePerLb;

        // Calculate actual cost based on financing method
        let actualCost = totalCost;
        if (financingMethod === 'tradeLoan') {
            actualCost = totalCost * (1 + this.bankingServices.tradeLoan.cost);
        }

        // Create order with payment terms
        const arrivalDay = this.gameState.day + Math.floor(Math.random() * 3) + 2;
        // Payment due date always follows vendor's credit terms
        const paymentDueDay = arrivalDay + vendorData.paymentTerms + 1;
        
        const order = {
            material,
            vendor,
            quantity,
            pricePerLb: pricePerLb,
            totalCost: actualCost,
            arrivalDay,
            paymentDueDay,
            financingMethod,
            paymentTerms: vendorData.paymentTerms,
            tenor: financingMethod === 'tradeLoan' ? parseInt(tenor) : null
        };

        this.gameState.orders.push(order);
        
        let eventMessage = `Ordered ${this.formatNumber(quantity)} ${materialData.unit} of ${materialData.name} from ${vendorData.name} for $${actualCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Arrives Day ${arrivalDay}. Payment due Day ${paymentDueDay}.`;
        
        if (financingMethod === 'tradeLoan') {
            eventMessage += ` Trade loan will be created when payment is due. Bank repayment due ${parseInt(tenor)} days after vendor payment.`;
        }
        
        this.addEvent('Order Placed', eventMessage);
        
        document.getElementById('orderModal').style.display = 'none';
        form.reset();
        this.updateDisplay();
    }

    processManufacturing() {
        const form = document.getElementById('manufactureForm');
        const product = document.getElementById('manufactureProduct').value;
        const quantity = parseInt(document.getElementById('manufactureQuantity').value);

        if (!product || !quantity) {
            alert('Please fill in all fields');
            return;
        }


        // Advance day only when manufacturing is actually performed
        this.advanceDay('Manufacturing');

        const productData = this.products[product];
        
        // Check if player has enough materials
        for (const [material, requiredQty] of Object.entries(productData.materials)) {
            const availableQty = this.gameState.inventory[material] || 0;
            const neededQty = requiredQty * quantity;
            
            if (availableQty < neededQty) {
                alert(`Insufficient ${this.rawMaterials[material].name}. Need ${this.formatNumber(neededQty)} ${this.rawMaterials[material].unit}, have ${this.formatNumber(availableQty)} ${this.rawMaterials[material].unit}.`);
                return;
            }
        }

        // Check if player has enough cash for manufacturing costs
        const totalManufacturingCost = quantity * productData.manufacturingCost;
        if (this.gameState.cash < totalManufacturingCost) {
            alert(`Insufficient cash for manufacturing costs. Need $${totalManufacturingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, have $${this.gameState.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`);
            return;
        }

        // Consume materials and cash
        for (const [material, requiredQty] of Object.entries(productData.materials)) {
            this.gameState.inventory[material] -= requiredQty * quantity;
            if (this.gameState.inventory[material] <= 0) {
                delete this.gameState.inventory[material];
            }
        }
        this.gameState.cash -= totalManufacturingCost;

        // Create manufacturing order with completion date
        const completionDay = this.gameState.day + productData.manufacturingDays;
        const manufacturingOrder = {
            product,
            quantity,
            completionDay,
            manufacturingCost: totalManufacturingCost
        };

        this.gameState.manufacturingOrders.push(manufacturingOrder);
        this.addEvent('Manufacturing Started', `Started manufacturing ${this.formatNumber(quantity)} of ${productData.name}. Cost: $${totalManufacturingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Completion: Day ${completionDay}.`);
        
        document.getElementById('manufactureModal').style.display = 'none';
        form.reset();
        this.updateDisplay();
    }

    processSales() {
        const form = document.getElementById('salesForm');
        const product = document.getElementById('salesProduct').value;
        const buyer = document.getElementById('salesBuyer').value;
        const quantity = parseInt(document.getElementById('salesQuantity').value);
        const financingMethod = document.getElementById('salesFinancingMethod').value;

        if (!product || !buyer || !quantity || !financingMethod) {
            alert('Please fill in all fields');
            return;
        }

        // Check if maximum active sales orders limit is reached
        if (this.gameState.salesOrders.length >= 3) {
            alert('Maximum of 3 active sales orders allowed');
            return;
        }

        // Advance day only when sales order is actually created
        this.advanceDay('Sales');

        const productData = this.products[product];
        const buyerData = this.buyers[buyer];
        const availableQty = this.gameState.finishedProducts[product] || 0;

        if (availableQty < quantity) {
            alert(`Insufficient inventory. Have ${availableQty}, trying to sell ${quantity}.`);
            return;
        }

        // Use manufacturing price as base (price from manufacturing tab)
        let baseSalePrice = productData.price; // Exact manufacturing price for 30-day terms
        
        // Credit term adjustments based on payment terms
        // 30 days = standard price, shorter terms = discount, longer terms = premium
        if (buyerData.paymentTerms === 0) {
            baseSalePrice *= 0.80; // 20% discount for cash payment (zero risk)
        } else if (buyerData.paymentTerms <= 15) {
            baseSalePrice *= 0.90; // 10% discount for very short terms
        } else if (buyerData.paymentTerms <= 30) {
            baseSalePrice *= 1.0; // Standard price for 30-day terms (exact manufacturing price)
        } else if (buyerData.paymentTerms <= 45) {
            baseSalePrice *= 1.05; // 5% premium for longer terms
        } else if (buyerData.paymentTerms <= 60) {
            baseSalePrice *= 1.10; // 10% premium for extended terms
        } else {
            baseSalePrice *= 1.15; // 15% premium for very long terms
        }
        
        let revenue = quantity * baseSalePrice;

        // Apply financing effects
        let finalRevenue = revenue;
        if (financingMethod === 'factoring') {
            finalRevenue *= (1 - this.bankingServices.factoring.cost);
        }

        // Apply default risk (chance of non-payment)
        const defaultRisk = buyerData.defaultRisk;
        const willDefault = Math.random() < defaultRisk;

        // Create sales order with payment terms
        const completionDay = this.gameState.day + Math.floor(Math.random() * 2) + 1;
        const paymentDueDay = completionDay + buyerData.paymentTerms + 1; // +1 because payment is due AFTER the credit terms
        const salesOrder = {
            product,
            buyer,
            quantity,
            basePrice: baseSalePrice,
            unitPrice: baseSalePrice,
            revenue: finalRevenue,
            originalRevenue: revenue, // Store original revenue before factoring
            financingMethod,
            completionDay,
            paymentDueDay,
            paymentTerms: buyerData.paymentTerms,
            defaultRisk: buyerData.defaultRisk,
            willDefault: willDefault,
            riskLevel: buyerData.riskLevel,
            factored: financingMethod === 'factoring' // Track if this order was factored
        };

        this.gameState.salesOrders.push(salesOrder);
        this.gameState.finishedProducts[product] -= quantity;
        
        if (this.gameState.finishedProducts[product] <= 0) {
            delete this.gameState.finishedProducts[product];
        }

        // If factoring, receive payment immediately (next day)
        if (financingMethod === 'factoring') {
            // Check maximum outstanding loans limit
            if (this.gameState.outstandingLoans.length >= 5) {
                alert('Maximum of 5 outstanding loans allowed. Please repay some loans or choose cash payment instead.');
                return;
            }
            
            this.gameState.cash += finalRevenue;
            
            // Create factoring loan for interest payment
            const factoringLoan = {
                principal: revenue, // Original invoice amount
                interestRate: this.bankingServices.factoring.cost,
                repaymentDay: paymentDueDay, // When buyer payment is due
                totalAmount: revenue * this.bankingServices.factoring.cost, // Only interest amount
                orderId: 'factoring_' + product + '_' + buyer + '_' + completionDay,
                type: 'factoring'
            };
            
            this.gameState.outstandingLoans.push(factoringLoan);
            
            this.addEvent('Factoring Payment', `Received immediate payment of $${finalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from bank for factored invoice. Interest of $${factoringLoan.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} due when buyer payment is received.`);
            
            // Clear bankruptcy deadline if cash becomes positive
            if (this.gameState.cash >= 0 && this.gameState.bankruptcyDay) {
                this.gameState.bankruptcyDay = null;
                this.addEvent('Debt Cleared', `Cash is now positive! Bankruptcy deadline cleared.`);
            }
        }

        this.addEvent('Sales Order Created', `Created sales order for ${this.formatNumber(quantity)} of ${productData.name} to ${buyerData.name} for $${finalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`);
        
        document.getElementById('salesModal').style.display = 'none';
        form.reset();
        this.updateDisplay();
    }

    canUseBankingService(service) {
        return this.gameState.reputation >= service.requirements.reputation &&
               this.gameState.cash >= service.requirements.cash;
    }

    useBankingService(serviceKey) {
        const service = this.bankingServices[serviceKey];
        if (!this.canUseBankingService(service)) {
            alert('Requirements not met for this banking service');
            return;
        }

        // If trade loan is clicked, open sourcing modal instead
        if (serviceKey === 'tradeLoan') {
            document.getElementById('bankModal').style.display = 'none';
            this.openOrderModal();
            return;
        }

        // If factoring is clicked, open sales modal instead
        if (serviceKey === 'factoring') {
            document.getElementById('bankModal').style.display = 'none';
            this.openSalesModal();
            return;
        }

        // Advance day only when banking service is actually used
        this.advanceDay('Banking');

        this.addEvent('Banking Service Used', `Used ${service.name}: ${service.description}`);
        this.gameState.reputation += 5; // Small reputation boost for using banking services
        
        // Clear bankruptcy deadline if cash becomes positive after banking service
        if (this.gameState.cash >= 0 && this.gameState.bankruptcyDay) {
            this.gameState.bankruptcyDay = null;
            this.addEvent('Debt Cleared', `Cash is now positive! Bankruptcy deadline cleared.`);
        }
        
        this.updateDisplay();
    }

    processDay() {
        console.log(`=== PROCESSING DAY ${this.gameState.day} ===`);
        
        // Process orders
        const arrivingOrders = this.gameState.orders.filter(order => order.arrivalDay === this.gameState.day);
        console.log(`Processing ${arrivingOrders.length} arriving orders`);
        arrivingOrders.forEach(order => {
            const materialName = this.rawMaterials[order.material].name;
            this.gameState.inventory[order.material] = (this.gameState.inventory[order.material] || 0) + order.quantity;
            this.addEvent('Order Arrived', `Received ${this.formatNumber(order.quantity)} ${this.rawMaterials[order.material].unit} of ${materialName} from ${this.vendors[order.vendor].name}.`);
        });

        // Process vendor payments (for orders that have arrived)
        const dueVendorPayments = this.gameState.orders.filter(order => 
            order.paymentDueDay === this.gameState.day && order.arrivalDay <= this.gameState.day);
        
        // Debug: Log all orders and their payment due dates
        console.log(`Day ${this.gameState.day}: Checking ${this.gameState.orders.length} orders for payment due`);
        if (this.gameState.orders.length > 0) {
            this.gameState.orders.forEach(order => {
                console.log(`Order: ${order.material}, Arrival: Day ${order.arrivalDay}, Payment Due: Day ${order.paymentDueDay}, Cost: $${order.totalCost}`);
                console.log(`  - Payment due check: ${order.paymentDueDay} === ${this.gameState.day}? ${order.paymentDueDay === this.gameState.day}`);
                console.log(`  - Arrival check: ${order.arrivalDay} <= ${this.gameState.day}? ${order.arrivalDay <= this.gameState.day}`);
                console.log(`  - Should be due: ${order.paymentDueDay === this.gameState.day && order.arrivalDay <= this.gameState.day}`);
            });
        }
        
        console.log(`Found ${dueVendorPayments.length} vendor payments due today`);
        
        dueVendorPayments.forEach(order => {
            console.log(`Processing vendor payment: ${order.material}, Cost: $${order.totalCost}, Current cash: $${this.gameState.cash}`);
            
            // Check if this order was financed with a trade loan
            if (order.financingMethod === 'tradeLoan') {
                // Check maximum outstanding loans limit
                if (this.gameState.outstandingLoans.length >= 5) {
                    this.addEvent('Loan Limit Reached', `Cannot create trade loan for ${this.vendors[order.vendor].name} payment. Maximum of 5 outstanding loans already reached. Deducting cash instead.`);
                    this.gameState.cash -= order.totalCost;
                    
                    // Set bankruptcy deadline if cash becomes negative
                    if (this.gameState.cash < 0 && !this.gameState.bankruptcyDay) {
                        this.gameState.bankruptcyDay = this.gameState.day + 60;
                        this.addEvent('Negative Cash', `Insufficient cash to pay ${this.vendors[order.vendor].name} $${order.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Cash is now negative. Must repay within 60 days or face bankruptcy!`);
                    } else if (this.gameState.cash < 0) {
                        this.addEvent('Vendor Payment', `Paid ${this.vendors[order.vendor].name} $${order.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for ${this.rawMaterials[order.material].name} order. Cash remains negative.`);
                    } else {
                        this.addEvent('Vendor Payment', `Paid ${this.vendors[order.vendor].name} $${order.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for ${this.rawMaterials[order.material].name} order (cash payment due to loan limit).`);
                    }
                    return;
                }
                
                // Create outstanding loan instead of deducting cash
                const loan = {
                    principal: order.totalCost,
                    interestRate: this.bankingServices.tradeLoan.cost,
                    repaymentDay: this.gameState.day + order.tenor,
                    totalAmount: order.totalCost * (1 + this.bankingServices.tradeLoan.cost),
                    orderId: order.material + '_' + order.vendor + '_' + order.arrivalDay
                };
                
                this.gameState.outstandingLoans.push(loan);
                this.addEvent('Trade Loan Created', `Bank paid ${this.vendors[order.vendor].name} $${order.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} on your behalf. Trade loan created. Repayment due Day ${loan.repaymentDay} (${order.tenor} days). Total amount due: $${loan.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`);
            } else {
                // Regular cash payment
                this.gameState.cash -= order.totalCost;
                
                if (this.gameState.cash < 0) {
                    // Set bankruptcy deadline if not already set
                    if (!this.gameState.bankruptcyDay) {
                        this.gameState.bankruptcyDay = this.gameState.day + 60;
                        this.addEvent('Negative Cash', `Insufficient cash to pay ${this.vendors[order.vendor].name} $${order.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Cash is now negative. Must repay within 60 days or face bankruptcy!`);
                    } else {
                        this.addEvent('Vendor Payment', `Paid ${this.vendors[order.vendor].name} $${order.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for ${this.rawMaterials[order.material].name} order. Cash remains negative.`);
                    }
                } else {
                    // Cash is positive, clear bankruptcy deadline
                    this.gameState.bankruptcyDay = null;
                    this.addEvent('Vendor Payment', `Paid ${this.vendors[order.vendor].name} $${order.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for ${this.rawMaterials[order.material].name} order.`);
                }
            }
            
            console.log(`Cash after payment: $${this.gameState.cash}`);
        });
        
        // Force display update after vendor payments
        if (dueVendorPayments.length > 0) {
            this.updateDisplay();
        }

        // Remove completed orders (both arrived and paid)
        const ordersBeforeRemoval = this.gameState.orders.length;
        this.gameState.orders = this.gameState.orders.filter(order => 
            order.paymentDueDay > this.gameState.day
        );
        console.log(`Removed ${ordersBeforeRemoval - this.gameState.orders.length} completed orders. ${this.gameState.orders.length} orders remaining.`);

        // Process manufacturing orders
        const completingManufacturing = this.gameState.manufacturingOrders.filter(order => order.completionDay === this.gameState.day);
        completingManufacturing.forEach(order => {
            const productData = this.products[order.product];
            this.gameState.finishedProducts[order.product] = (this.gameState.finishedProducts[order.product] || 0) + order.quantity;
            this.addEvent('Manufacturing Complete', `Completed manufacturing ${this.formatNumber(order.quantity)} of ${productData.name}.`);
        });

        // Remove completed manufacturing orders
        this.gameState.manufacturingOrders = this.gameState.manufacturingOrders.filter(order => order.completionDay > this.gameState.day);

        // Process sales orders
        const completingSales = this.gameState.salesOrders.filter(order => order.completionDay === this.gameState.day);
        completingSales.forEach(order => {
            // Sale completed - no payment yet, just mark as completed
            this.addEvent('Sale Completed', `Completed sale to ${this.buyers[order.buyer].name} (${this.buyers[order.buyer].location}) for $${order.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Payment due Day ${order.paymentDueDay}.`);
            
            // Check for reputation bonus every 1000 products sold
            if (!this.gameState.totalProductsSold) {
                this.gameState.totalProductsSold = 0;
            }
            this.gameState.totalProductsSold += order.quantity;
            
            const reputationBonus = Math.floor(this.gameState.totalProductsSold / 1000) * 2;
            const currentReputationBonus = Math.floor((this.gameState.totalProductsSold - order.quantity) / 1000) * 2;
            
            if (reputationBonus > currentReputationBonus) {
                const newBonus = reputationBonus - currentReputationBonus;
                this.gameState.reputation += newBonus;
                this.addEvent('Reputation Bonus', `Sold ${this.formatNumber(this.gameState.totalProductsSold)} total products! Reputation +${newBonus}.`);
            }
        });

        // Process payment collections
        const duePayments = this.gameState.salesOrders.filter(order => order.paymentDueDay === this.gameState.day);
        
        // Debug: Log all sales orders and their payment due dates
        if (this.gameState.salesOrders.length > 0) {
            console.log(`Day ${this.gameState.day}: Checking ${this.gameState.salesOrders.length} sales orders for payment due`);
            this.gameState.salesOrders.forEach(order => {
                console.log(`Sales Order: ${order.product}, Completion: Day ${order.completionDay}, Payment Due: Day ${order.paymentDueDay}, Revenue: $${order.revenue}, Will Default: ${order.willDefault}`);
            });
        }
        
        duePayments.forEach(order => {
            console.log(`Processing buyer payment: ${order.product}, Revenue: $${order.revenue}, Current cash: $${this.gameState.cash}`);
            
            // Skip payment if order was factored (already received payment from bank)
            if (order.factored) {
                this.addEvent('Factored Invoice', `Buyer ${this.buyers[order.buyer].name} (${this.buyers[order.buyer].location}) payment due, but invoice was already factored. Bank will collect payment.`);
                
                // Process factoring interest payment
                const factoringLoan = this.gameState.outstandingLoans.find(loan => 
                    loan.type === 'factoring' && loan.orderId === 'factoring_' + order.product + '_' + order.buyer + '_' + order.completionDay
                );
                
                if (factoringLoan) {
                    if (this.gameState.cash >= factoringLoan.totalAmount) {
                        this.gameState.cash -= factoringLoan.totalAmount;
                        this.addEvent('Factoring Interest Paid', `Paid factoring interest of $${factoringLoan.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to bank.`);
                    } else {
                        this.addEvent('Factoring Interest Default', `Unable to pay factoring interest of $${factoringLoan.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Insufficient cash. Reputation -5.`);
                        this.gameState.reputation -= 5;
                    }
                }
                
                return;
            }
            
            // Check if buyer defaults on payment
            if (order.willDefault) {
                this.addEvent('Payment Default', `Buyer ${this.buyers[order.buyer].name} (${this.buyers[order.buyer].location}) defaulted on payment of $${order.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. No payment received.`);
                this.gameState.reputation -= 5; // Reputation penalty for dealing with defaulting buyers
                console.log(`Buyer defaulted - no payment received. Reputation -5.`);
            } else {
                this.gameState.cash += order.revenue;
                this.gameState.reputation += 2; // Small reputation boost for successful sales
                
                // Clear bankruptcy deadline if cash becomes positive
                if (this.gameState.cash >= 0 && this.gameState.bankruptcyDay) {
                    this.gameState.bankruptcyDay = null;
                    this.addEvent('Debt Cleared', `Cash is now positive! Bankruptcy deadline cleared.`);
                }
                
                this.addEvent('Payment Received', `Received payment of $${order.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from ${this.buyers[order.buyer].name} (${this.buyers[order.buyer].location}).`);
                console.log(`Cash after payment received: $${this.gameState.cash}`);
            }
        });
        
        // Force display update after buyer payments
        if (duePayments.length > 0) {
            this.updateDisplay();
        }

        // Remove completed sales (both completed and paid)
        this.gameState.salesOrders = this.gameState.salesOrders.filter(order => 
            order.paymentDueDay > this.gameState.day
        );

        // Process loan repayments (only trade loans, factoring is handled separately)
        const dueLoans = this.gameState.outstandingLoans.filter(loan => loan.repaymentDay === this.gameState.day && loan.type !== 'factoring');
        dueLoans.forEach(loan => {
            if (this.gameState.cash >= loan.totalAmount) {
                this.gameState.cash -= loan.totalAmount;
                this.addEvent('Loan Repaid', `Repaid trade loan of $${loan.principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} plus interest of $${(loan.totalAmount - loan.principal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Total: $${loan.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`);
            } else {
                this.addEvent('Loan Default', `Unable to repay trade loan of $${loan.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Insufficient cash. Reputation -10.`);
                this.gameState.reputation -= 10;
            }
        });

        // Remove repaid loans and factoring interest payments
        this.gameState.outstandingLoans = this.gameState.outstandingLoans.filter(loan => loan.repaymentDay > this.gameState.day);

        // Generate random events (20% chance, max one per day)
        if (Math.random() < 0.2 && !this.gameState.eventTriggeredToday) {
            this.generateRandomEvent();
            this.gameState.eventTriggeredToday = true; // Prevent multiple events per day
        }

        // Update market prices
        this.generateMarketPrices();
    }

    advanceDay(actionType) {
        this.gameState.day++;
        this.gameState.eventTriggeredToday = false; // Reset event trigger for new day
        
        // Check for win condition first
        if (this.checkWinCondition()) {
            return;
        }
        
        // Check for bankruptcy
        if (this.gameState.bankruptcyDay && this.gameState.day >= this.gameState.bankruptcyDay) {
            this.gameOver();
            return;
        }
        
        // Only add day transition event if it's not Day 1 (to avoid duplicate with welcome message)
        if (this.gameState.day > 1) {
            this.addEvent('Day Transition', `Day ${this.gameState.day} - ${actionType} Action`);
        }
        this.processDay();
        this.updateDisplay();
    }

    nextDay() {
        this.gameState.day++;
        this.gameState.eventTriggeredToday = false; // Reset event trigger for new day
        
        // Check for win condition first
        if (this.checkWinCondition()) {
            return;
        }
        
        // Check for bankruptcy
        if (this.gameState.bankruptcyDay && this.gameState.day >= this.gameState.bankruptcyDay) {
            this.gameOver();
            return;
        }
        
        // Only add day transition event if it's not Day 1 (to avoid duplicate with welcome message)
        if (this.gameState.day > 1) {
            this.addEvent('Day Transition', `Starting Day ${this.gameState.day}`);
        }
        this.processDay();
        this.updateDisplay();
    }

    checkWinCondition() {
        // Check if player has reached 1 million dollars
        if (this.gameState.cash >= 1000000) {
            this.victory();
            return true;
        }
        
        // Check if 365 days have passed
        if (this.gameState.day > 365) {
            this.timeUp();
            return true;
        }
        
        return false;
    }

    victory() {
        this.addEvent('🎉 VICTORY!', `Congratulations! You have successfully grown your business to hit the $1,000,000 revenue mark!`);
        
        // Show victory modal
        const victoryModal = document.createElement('div');
        victoryModal.className = 'modal';
        victoryModal.id = 'victoryModal';
        victoryModal.style.display = 'block';
        victoryModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🎉 Congratulations!</h3>
                </div>
                <div class="modal-body">
                    <p style="font-size: 1.2rem; color: #10b981; font-weight: 600; margin-bottom: 20px;">
                        You have successfully grown your business to hit the $1,000,000 revenue mark!
                    </p>
                    <p><strong>Final Cash:</strong> $${this.gameState.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p><strong>Final Reputation:</strong> ${this.gameState.reputation}</p>
                    <p><strong>Days to Complete:</strong> ${this.gameState.day}</p>
                    <p style="margin-top: 20px;"><strong>What would you like to do next?</strong></p>
                </div>
                <div class="modal-footer" style="display: flex; gap: 10px; justify-content: center;">
                    <button class="btn-secondary" onclick="game.continueGame()">Continue Playing</button>
                    <button class="btn-primary" onclick="location.reload()">Restart Game</button>
                </div>
            </div>
        `;
        document.body.appendChild(victoryModal);
        
        // Disable all game actions temporarily
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.disabled = true;
        });
    }

    continueGame() {
        // Find and close victory or time-up modal specifically
        const victoryModal = document.getElementById('victoryModal');
        const timeUpModal = document.getElementById('timeUpModal');
        
        if (victoryModal) {
            victoryModal.remove();
        } else if (timeUpModal) {
            timeUpModal.remove();
        }
        
        // Re-enable game actions
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.disabled = false;
        });
        
        // Add event about continuing
        this.addEvent('Continuing', 'Choosing to continue playing despite the objective being met. Good luck with your business expansion!');
    }

    timeUp() {
        const finalCash = this.gameState.cash;
        const won = finalCash >= 1000000;
        
        if (won) {
            this.victory();
        } else {
            this.addEvent('⏰ Time Up!', `The 365-day period has ended. You have ${finalCash >= 1000000 ? 'successfully' : 'failed to'} reach the $1,000,000 revenue target.`);
            
            // Show time up modal
            const timeUpModal = document.createElement('div');
            timeUpModal.className = 'modal';
            timeUpModal.id = 'timeUpModal';
            timeUpModal.style.display = 'block';
            timeUpModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>⏰ Time's Up!</h3>
                    </div>
                    <div class="modal-body">
                        <p>The 365-day period has ended!</p>
                        <p><strong>Final Cash:</strong> $${finalCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p><strong>Target:</strong> $1,000,000</p>
                        <p style="font-size: 1.1rem; color: ${finalCash >= 1000000 ? '#10b981' : '#dc2626'}; font-weight: 600;">
                            ${finalCash >= 1000000 ? '🎉 Congratulations! Objective achieved!' : '❌ Objective not met.'}
                        </p>
                        <p><strong>Final Reputation:</strong> ${this.gameState.reputation}</p>
                    </div>
                    <div class="modal-footer" style="display: flex; gap: 10px; justify-content: center;">
                        <button class="btn-secondary" onclick="game.continueGame()">Continue Playing</button>
                        <button class="btn-primary" onclick="location.reload()">Restart Game</button>
                    </div>
                </div>
            `;
            document.body.appendChild(timeUpModal);
            
            // Disable all game actions temporarily
            document.querySelectorAll('.action-btn').forEach(btn => {
                btn.disabled = true;
            });
        }
    }

    gameOver() {
        this.addEvent('Game Over', `Bankruptcy! You failed to repay your debts within 60 days. Game over!`);
        
        // Show game over modal
        const gameOverModal = document.createElement('div');
        gameOverModal.className = 'modal';
        gameOverModal.id = 'gameOverModal';
        gameOverModal.style.display = 'block';
        gameOverModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Game Over</h3>
                </div>
                <div class="modal-body">
                    <p>You have gone bankrupt! You failed to repay your debts within 60 days.</p>
                    <p>Final Cash: $${this.gameState.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p>Final Reputation: ${this.gameState.reputation}</p>
                    <p>Days Survived: ${this.gameState.day}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="location.reload()">Restart Game</button>
                </div>
            </div>
        `;
        document.body.appendChild(gameOverModal);
        
        // Disable all game actions
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent !== 'Restart Game') {
                btn.disabled = true;
            }
        });
    }

    generateRandomEvent() {
        // All events have equal probability (33.33% each)
        const events = [
            {
                type: 'Economic News',
                message: 'Due to changing economic policies, labour costs have increased. Manufacturing cost increased by 1 to 2%.'
            },
            {
                type: 'Market Opportunity',
                message: 'Your company is getting known in the market and +5 reputation.'
            },
            {
                type: 'Banking News',
                message: 'Interest rates have changed. Banking service costs may vary.'
            }
        ];
        const selectedEvent = events[Math.floor(Math.random() * events.length)];

        this.addEvent(selectedEvent.type, selectedEvent.message);

        // Apply event effects
        if (selectedEvent.type === 'Market Opportunity') {
            this.gameState.reputation += 5;
        } else if (selectedEvent.type === 'Economic News') {
            this.updateManufacturingCosts();
        } else if (selectedEvent.type === 'Banking News') {
            this.updateBankingRates();
        }
    }

    updateManufacturingCosts() {
        // Randomly increase manufacturing costs by 1-2%
        const costIncreaseFactor = 1 + (0.01 + Math.random() * 0.01); // 1-2% increase
        
        // Update manufacturing costs for all products
        Object.keys(this.products).forEach(productKey => {
            this.products[productKey].manufacturingCost *= costIncreaseFactor;
        });
        
        const percentageIncrease = ((costIncreaseFactor - 1) * 100).toFixed(1);
        this.addEvent('Manufacturing Costs Updated', 
            `Manufacturing costs have increased by ${percentageIncrease}% across all products due to labor cost increases.`);
    }

    updateBankingRates() {
        const oldTradeLoanRate = this.bankingServices.tradeLoan.cost;
        const oldFactoringRate = this.bankingServices.factoring.cost;
        
        // Generate new rates within ±50% of current rates
        const tradeLoanRateVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
        const factoringRateVariation = (Math.random() - 0.5) * 0.015; // ±0.75% variation
        
        this.bankingServices.tradeLoan.cost = Math.max(0.04, Math.min(0.10, oldTradeLoanRate + tradeLoanRateVariation));
        this.bankingServices.factoring.cost = Math.max(0.04, Math.min(0.08, oldFactoringRate + factoringRateVariation));
        
        // Update existing loans with new rates
        this.gameState.outstandingLoans.forEach(loan => {
            if (loan.type === 'factoring') {
                const originalPrincipal = loan.principal;
                loan.interestRate = this.bankingServices.factoring.cost;
                loan.totalAmount = originalPrincipal * this.bankingServices.factoring.cost;
            } else {
                // Trade loans: recalculate total amount based on new rate
                const originalPrincipal = loan.principal;
                loan.interestRate = this.bankingServices.tradeLoan.cost;
                loan.totalAmount = originalPrincipal * (1 + loan.interestRate);
            }
        });
        
        const oldTradePercent = (oldTradeLoanRate * 100).toFixed(2);
        const newTradePercent = (this.bankingServices.tradeLoan.cost * 100).toFixed(2);
        const oldFactoringPercent = (oldFactoringRate * 100).toFixed(2);
        const newFactoringPercent = (this.bankingServices.factoring.cost * 100).toFixed(2);
        
        this.addEvent('Interest Rates Updated', 
            `Banking rates have changed: Trade Loan ${oldTradePercent}% → ${newTradePercent}%, Factoring ${oldFactoringPercent}% → ${newFactoringPercent}%. Existing loans updated with new rates.`);
    }

    triggerMarketOpportunity() {
        // Material discount opportunity only
        const materials = Object.keys(this.rawMaterials);
        const selectedMaterial = materials[Math.floor(Math.random() * materials.length)];
        
        // Random discount between 10-30%
        const discountPercent = 10 + Math.random() * 20; // 10% to 30%
        const discountFactor = 1 - (discountPercent / 100); // Convert to decimal factor
        
        this.marketOpportunity.active = true;
        this.marketOpportunity.material = selectedMaterial;
        this.marketOpportunity.daysRemaining = 5;
        this.marketOpportunity.discountFactor = discountFactor;
        
        const materialName = this.rawMaterials[selectedMaterial].name;
        const roundedDiscount = Math.round(discountPercent);
        this.addEvent('🔥 Market Oversupply!', 
            `Market oversupply of ${materialName}! ${materialName} vendors are offering ${roundedDiscount}% discounts for the next 5 days due to oversupply. Take advantage of this opportunity!`);
    }

    endMarketOpportunity() {
        if (!this.marketOpportunity.active) return;
        
        this.marketOpportunity.active = false;
        this.marketOpportunity.material = null;
        this.marketOpportunity.daysRemaining = 0;
        this.marketOpportunity.discountFactor = 1.0;
        
        // No event message needed as the visual indicator will disappear from market prices
    }

    formatNumber(num) {
        return num.toLocaleString('en-US');
    }

    addEvent(type, message) {
        const eventsDiv = document.getElementById('events');
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event';
        eventDiv.innerHTML = `
            <div class="event-header">
                <span class="event-time">Day ${this.gameState.day}</span>
                <span class="event-type">${type}</span>
            </div>
            <div class="event-content">${message}</div>
        `;
        eventsDiv.appendChild(eventDiv);

        // Keep all events - no limit on history
        // Auto-scroll to show the latest event
        eventsDiv.scrollTop = eventsDiv.scrollHeight;
    }
}

// Initialize the game when the page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new TradeFinanceGame();
});

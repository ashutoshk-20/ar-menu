/*
Overview:
- Purpose: Core functionality for menu interaction and AR transitions
- Workflow:
  1. Manages food item display and category navigation
  2. Handles 3D model loading and preview
  3. Controls modal interactions and transitions
  4. Manages AR view state and transitions
  5. Provides utility functions for food item lookup
*/

// Menu page functionality
let currentCategory = 'bestsellers';
// let scene, camera, renderer; // Three.js variables - assuming these are not needed for current menu display
let currentItemId = null; // Variable to store the ID of the currently displayed item

// Settings state management
let currentSettings = {
    priceRange: { min: 0, max: 2000 },
    sortOrder: 'default',
    dietaryPreferences: [],
    language: 'en'
};

// Initialize the menu page
document.addEventListener('DOMContentLoaded', function() {
    initializeSettings();
    loadCategory(currentCategory);
    setupCategoryNavigation();
    // Check if init3DViewer or animate3DScene are still relevant or can be removed.

    
    // Add smooth entrance animations
    setTimeout(() => {
        const sidebar = document.querySelector('.category-sidebar');
        const content = document.querySelector('.menu-content');
        if (sidebar) sidebar.style.opacity = '1';
        if (content) content.style.opacity = '1';
    }, 300);
});

// Initialize settings from localStorage if available
function initializeSettings() {
    const savedSettings = localStorage.getItem('menuSettings');
    if (savedSettings) {
        currentSettings = JSON.parse(savedSettings);
        applySavedSettings();
    }
}

// Apply saved settings to UI
function applySavedSettings() {
    // Price range
    document.getElementById('priceMin').value = currentSettings.priceRange.min;
    document.getElementById('priceMax').value = currentSettings.priceRange.max;
    updatePriceDisplay();

    // Sort order
    document.getElementById('sortOrder').value = currentSettings.sortOrder;

    // Dietary preferences
    const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = currentSettings.dietaryPreferences.includes(checkbox.value);
    });

    // Language
    document.getElementById('language').value = currentSettings.language;
}

// Update price display values
function updatePriceDisplay() {
    const minValue = document.getElementById('priceMin').value;
    const maxValue = document.getElementById('priceMax').value;
    document.getElementById('priceMinValue').textContent = `₹${minValue}`;
    document.getElementById('priceMaxValue').textContent = `₹${maxValue}`;
}

// Handle price range slider changes
document.getElementById('priceMin').addEventListener('input', function() {
    const minValue = parseInt(this.value);
    const maxValue = parseInt(document.getElementById('priceMax').value);
    if (minValue > maxValue) {
        this.value = maxValue;
    }
    updatePriceDisplay();
});

document.getElementById('priceMax').addEventListener('input', function() {
    const maxValue = parseInt(this.value);
    const minValue = parseInt(document.getElementById('priceMin').value);
    if (maxValue < minValue) {
        this.value = minValue;
    }
    updatePriceDisplay();
});

// Apply settings and filter menu
function applySettings() {
    // Update current settings
    currentSettings.priceRange = {
        min: parseInt(document.getElementById('priceMin').value),
        max: parseInt(document.getElementById('priceMax').value)
    };
    currentSettings.sortOrder = document.getElementById('sortOrder').value;
    
    // Get selected dietary preferences
    const selectedPreferences = Array.from(
        document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked')
    ).map(checkbox => checkbox.value);
    
    console.log('Selected dietary preferences:', selectedPreferences);
    currentSettings.dietaryPreferences = selectedPreferences;
    
    currentSettings.language = document.getElementById('language').value;

    // Save settings to localStorage
    localStorage.setItem('menuSettings', JSON.stringify(currentSettings));

    // Apply filters and reload current category
    loadCategory(currentCategory);
    closeSettings();
}

// Reset settings to default
function resetSettings() {
    currentSettings = {
        priceRange: { min: 0, max: 2000 },
        sortOrder: 'default',
        dietaryPreferences: [],
        language: 'en'
    };
    applySavedSettings();
}

// Load food items for a specific category
function loadCategory(category) {
    currentCategory = category;
    const menuGrid = document.getElementById('menuGrid');
    const categoryTitle = document.getElementById('currentCategory');
    
    // Update category title
    const categoryNames = {
        bestsellers: 'Best Sellers',
        pizza: 'Pizza',
        burgers: 'Burgers',
        beverages: 'Beverages',
        desserts: 'Desserts'
    };
    
    categoryTitle.textContent = categoryNames[category];
    
    // Clear existing items
    menuGrid.innerHTML = '';
    
    // Get items for this category
    let items = menuData[category] || [];
    
    // Apply filters
    items = items.filter(item => {
        // Price range filter
        const priceInRange = item.priceValue >= currentSettings.priceRange.min && 
                           item.priceValue <= currentSettings.priceRange.max;
        
        // Dietary preferences filter
        let matchesDietary = true;
        if (currentSettings.dietaryPreferences.length > 0) {
            // Item must match ALL selected preferences
            matchesDietary = currentSettings.dietaryPreferences.every(pref => 
                item.dietaryTags.includes(pref)
            );
        }
        
        return priceInRange && matchesDietary;
    });
    
    // If no items match the filters, show a message
    if (items.length === 0) {
        const noItemsMessage = document.createElement('div');
        noItemsMessage.className = 'no-items-message';
        
        // Create a more specific message based on the filters
        let message = '';
        if (currentSettings.dietaryPreferences.length > 0) {
            const preferences = currentSettings.dietaryPreferences.join(', ');
            message = `
                <i class="fas fa-utensils"></i>
                <p>No items in ${categoryNames[category]} match all your selected dietary preferences: ${preferences}</p>
                <p class="sub-message">Try selecting fewer preferences or check other categories</p>
                <button onclick="resetSettingsAndReload()" class="reset-filters-btn">Reset Filters</button>
            `;
        } else {
            message = `
                <i class="fas fa-search"></i>
                <p>No items match your current price range</p>
                <p class="sub-message">Try adjusting your price range or check other categories</p>
                <button onclick="resetSettingsAndReload()" class="reset-filters-btn">Reset Filters</button>
            `;
        }
        
        noItemsMessage.innerHTML = message;
        menuGrid.appendChild(noItemsMessage);
        return;
    }
    
    // Apply sorting
    if (currentSettings.sortOrder === 'low-to-high') {
        items.sort((a, b) => a.priceValue - b.priceValue);
    } else if (currentSettings.sortOrder === 'high-to-low') {
        items.sort((a, b) => b.priceValue - a.priceValue);
    }
    
    // Create food cards
    items.forEach((item, index) => {
        const card = createFoodCard(item);
        menuGrid.appendChild(card);
        
        // Animate card entrance
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 150);
    });
}

// Create a food card element
function createFoodCard(item) {
    const card = document.createElement('div');
    card.className = 'food-card';
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease';
    
    card.innerHTML = `
        <div class="food-image">
            <img src="${item.image}" alt="${item.name}" class="food-img" />
            <div class="food-badges">
                <span class="food-badge ${item.type}">${item.type === 'veg' ? 'VEG' : 'NON-VEG'}</span>
                <span class="price-badge">${item.price}</span>
            </div>
        </div>
        <div class="food-content">
            <div class="food-name">${item.name}</div>
            <div class="food-description">${item.description}</div>
        </div>
    `;
    
    // Add click event to open detail modal
    card.addEventListener('click', () => openFoodDetail(item.id));
    
    return card;
}

// Setup category navigation
function setupCategoryNavigation() {
    const categoryItems = document.querySelectorAll('.category-item');
    
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            categoryItems.forEach(cat => cat.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Load the selected category
            const category = item.getAttribute('data-category');
            loadCategory(category);
        });
    });
}

// Function to open food detail modal
function openFoodDetail(itemId) {
    console.log('openFoodDetail called with itemId:', itemId);
    try {
        const item = findFoodItem(itemId);
        console.log('Found item:', item);
        if (!item) {
            console.error('Item not found for ID:', itemId);
            return;
        }

        // Store the current item ID here
        currentItemId = itemId;
        console.log('Set currentItemId to:', currentItemId);
        const arButton = document.querySelector('.ar-view-btn');
        if (arButton) {
        arButton.onclick = function() {
            // Store the item ID in localStorage
            localStorage.setItem('currentArItemId', itemId);
            window.location.href = '/fullar';
        };
    }

        // Update model viewer
        const modelViewer = document.getElementById('foodModel');
        console.log('Model viewer element:', modelViewer);
        if (modelViewer && item.modelPath) {
            modelViewer.src = '/static/' + item.modelPath;
            console.log('Set model path to:', '/static/' + item.modelPath);
        } else if (modelViewer) {
            modelViewer.src = '';
            console.warn(`Item with ID ${itemId} has no modelPath.`);
        }

        // Update food information
        try {
            document.getElementById('foodDetailName').textContent = item.name;
            document.getElementById('foodType').textContent = item.type;
            document.getElementById('foodPrice').textContent = item.price;
            document.getElementById('foodDescription').textContent = item.description;
            document.getElementById('foodServes').textContent = item.serves;
            document.getElementById('foodCalories').textContent = item.calories;
            document.getElementById('foodPrepTime').textContent = item.prepTime;
            console.log('Updated food information in modal');
        } catch (error) {
            console.error('Error updating food information:', error);
        }

        // Update ingredients
        try {
            const ingredientsList = document.getElementById('foodIngredients');
            ingredientsList.innerHTML = '';
            item.ingredients.forEach(ingredient => {
                const tag = document.createElement('span');
                tag.className = 'ingredient-tag';
                tag.textContent = ingredient;
                ingredientsList.appendChild(tag);
            });
            console.log('Updated ingredients list');
        } catch (error) {
            console.error('Error updating ingredients:', error);
        }

        // Show the modal
        try {
            document.getElementById('foodDetailModal').style.display = 'block';
            document.body.style.overflow = 'hidden';
            console.log('Modal displayed');
        } catch (error) {
            console.error('Error showing modal:', error);
        }
    } catch (error) {
        console.error('Error in openFoodDetail:', error);
    }
}

// Function to close food detail modal
function closeFoodDetail() {
    document.getElementById('foodDetailModal').style.display = 'none';
    document.body.style.overflow = 'auto';
     currentItemId = null; // Clear current item ID when modal closes
}

// Function to find food item by ID across all categories
function findFoodItem(idToFind) {
    // Ensure idToFind is a number for strict comparison
     const numericalId = parseInt(idToFind, 10);
     if (isNaN(numericalId)) return null; // Return null if ID is not a valid number

    for (const category in menuData) {
        // Use strict equality (===) for comparison
        const item = menuData[category].find(item => item.id === numericalId);
        if (item) return item;
    }
    return null;
}

function goBack() {
    window.history.back();
}

// Function to open settings modal
function openSettings() {
    document.getElementById('settingsModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Function to close settings modal
function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const foodModal = document.getElementById('foodDetailModal');
    const settingsModal = document.getElementById('settingsModal');
    const arModal = document.getElementById('arViewModal'); // Get AR modal

    if (event.target === foodModal) {
        closeFoodDetail();
    }
    if (event.target === settingsModal) {
        closeSettings();
    }
     // Close AR modal if click is outside
    if (event.target === arModal) {
        closeARView();
    }
}

// Close modals with escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        // Check if any modal is open before closing
        const foodModal = document.getElementById('foodDetailModal');
        const settingsModal = document.getElementById('settingsModal');
        const arModal = document.getElementById('arViewModal'); // Get AR modal

        if (arModal.style.display === 'block') { // Prioritize closing AR modal
             closeARView();
        } else if (foodModal.style.display === 'block') {
             closeFoodDetail();
        } else if (settingsModal.style.display === 'block') {
             closeSettings();
        }
    }
});

// Touch gestures for mobile
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartY = e.changedTouches[0].screenY;
    
    // Add touch feedback
    if (e.target.closest('.food-card')) {
        e.target.closest('.food-card').style.transform = 'scale(0.98)';
    }
});

document.addEventListener('touchend', function(e) {
    touchEndY = e.changedTouches[0].screenY;
    
    // Remove touch feedback
    if (e.target.closest('.food-card')) {
        setTimeout(() => {
            e.target.closest('.food-card').style.transform = '';
        }, 150);
    }
    
    // Handle swipe gestures
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchStartY - touchEndY;
    
    // You could add swipe navigation between categories here
    if (Math.abs(swipeDistance) > swipeThreshold) {
        // Swipe detected
        console.log('Swipe detected:', swipeDistance > 0 ? 'up' : 'down');
    }
}

// Add smooth scrolling for category sidebar
document.querySelector('.category-sidebar').addEventListener('wheel', function(e) {
    e.preventDefault();
    this.scrollLeft += e.deltaY;
});

// Optimize performance for mobile
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // You could register a service worker here for offline functionality
        console.log('Service worker support detected');
    });
}

// --- Modal Carousel Functionality --- (New) --- 

// Function to get all food items in the current category
function getCurrentCategoryItems() {
    return menuData[currentCategory] || [];
}

// Function to find the index of an item within its category
function findItemIndexInCategory(itemId) {
    const items = getCurrentCategoryItems();
    // Ensure strict comparison with number type
    return items.findIndex(item => item.id === parseInt(itemId, 10));
}

// Function to navigate to the next item in the modal
function navigateNextItem() {
    console.log('navigateNextItem function called');
    try {
        const items = getCurrentCategoryItems();
        console.log('Current category items:', items);
        // Use strict comparison for null
        if (items.length === 0 || currentItemId === null) {
            console.warn('Cannot navigate: items array is empty or currentItemId is null');
            return;
        }

        // Ensure currentItemId is treated as a number
        let currentIndex = findItemIndexInCategory(currentItemId);
        console.log('Current index:', currentIndex);
        if (currentIndex === -1) {
            console.warn(`Current item ID ${currentItemId} not found in category ${currentCategory}.`);
            return;
        }

        const nextIndex = (currentIndex + 1) % items.length;
        console.log('Next index:', nextIndex);
        openFoodDetail(items[nextIndex].id);
    } catch (error) {
        console.error('Error in navigateNextItem:', error);
    }
}

// Function to navigate to the previous item in the modal
function navigatePreviousItem() {
    console.log('navigatePreviousItem function called');
    try {
        const items = getCurrentCategoryItems();
        console.log('Current category items:', items);
        // Use strict comparison for null
        if (items.length === 0 || currentItemId === null) {
            console.warn('Cannot navigate: items array is empty or currentItemId is null');
            return;
        }

        // Ensure currentItemId is treated as a number
        let currentIndex = findItemIndexInCategory(currentItemId);
        console.log('Current index:', currentIndex);
        if (currentIndex === -1) {
            console.warn(`Current item ID ${currentItemId} not found in category ${currentCategory}.`);
            return;
        }

        const previousIndex = (currentIndex - 1 + items.length) % items.length;
        console.log('Previous index:', previousIndex);
        openFoodDetail(items[previousIndex].id);
    } catch (error) {
        console.error('Error in navigatePreviousItem:', error);
    }
}

// You'll need to add buttons or swipe listeners in menu.html
// to call navigateNextItem() and navigatePreviousItem()

// Update the CSS for the no items message
const style = document.createElement('style');
style.textContent = `
    .no-items-message {
        text-align: center;
        padding: 40px;
        color: #666;
        background: #f9f9f9;
        border-radius: 8px;
        margin: 20px;
    }
    
    .no-items-message i {
        font-size: 48px;
        margin-bottom: 16px;
        color: #999;
    }
    
    .no-items-message p {
        margin-bottom: 12px;
        font-size: 18px;
    }
    
    .no-items-message .sub-message {
        font-size: 14px;
        color: #888;
        margin-bottom: 20px;
    }
    
    .reset-filters-btn {
        padding: 8px 16px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.3s;
    }
    
    .reset-filters-btn:hover {
        background-color: #45a049;
    }
`;
document.head.appendChild(style);

// Reset settings when page is closed or unloaded
window.addEventListener('beforeunload', function() {
    // Clear the saved settings from localStorage
    localStorage.removeItem('menuSettings');
});

// Add new function to handle reset and reload
function resetSettingsAndReload() {
    // Reset current settings to default values
    currentSettings = {
        priceRange: { min: 0, max: 2000 },
        sortOrder: 'default',
        dietaryPreferences: [],
        language: 'en'
    };

    // Reset UI elements
    document.getElementById('priceMin').value = 0;
    document.getElementById('priceMax').value = 2000;
    updatePriceDisplay();

    // Reset sort order
    document.getElementById('sortOrder').value = 'default';

    // Reset all dietary preference checkboxes
    const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    // Reset language
    document.getElementById('language').value = 'en';

    // Save reset settings to localStorage
    localStorage.setItem('menuSettings', JSON.stringify(currentSettings));

    // Reload current category with reset settings
    loadCategory(currentCategory);
}

//just checking
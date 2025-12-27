// Local Storage Keys
const STORAGE_KEYS = {
    USERS: 'gameRewardSystem_users',
    CURRENT_USER: 'gameRewardSystem_currentUser'
};

// Current user data
let currentUser = null;
let userData = null;

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
});

// Check if user is logged in
function checkLoginStatus() {
    const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        loadUserData();
        showDashboard();
    } else {
        showAuth();
    }
}

// Show/Hide Sections
function showAuth() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
}

function showDashboard() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    showPage('overview'); // Default to overview page
    updateDashboard();
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

// Show Page (Overview or Referral)
function showPage(pageName) {
    // Hide all pages
    document.getElementById('overviewPage').style.display = 'none';
    document.getElementById('referralPage').style.display = 'none';
    
    // Remove active class from all nav buttons
    document.getElementById('navOverview').classList.remove('active');
    document.getElementById('navReferral').classList.remove('active');
    
    // Show selected page
    if (pageName === 'overview') {
        document.getElementById('overviewPage').style.display = 'block';
        document.getElementById('navOverview').classList.add('active');
    } else if (pageName === 'referral') {
        document.getElementById('referralPage').style.display = 'block';
        document.getElementById('navReferral').classList.add('active');
    }
}

// Get all users from localStorage
function getAllUsers() {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : {};
}

// Save all users to localStorage
function saveAllUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// Generate unique referral code
function generateReferralCode(username) {
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return username.substring(0, 3).toUpperCase() + randomStr;
}

// Register Function
function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (!username || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    // Check if email or username already exists
    const users = getAllUsers();
    
    // Check email
    if (users[email]) {
        alert('Email already registered!');
        return;
    }
    
    // Check username
    for (let userEmail in users) {
        if (users[userEmail].username.toLowerCase() === username.toLowerCase()) {
            alert('Username already taken!');
            return;
        }
    }

    // Create new user
    const newUser = {
        username: username,
        email: email,
        password: password,
        createdAt: Date.now(),
        balance: 0,
        deposited: 0,
        dailyClaim: 0,
        dailyClaimBonus: 0,
        totalClaimed: 0,
        totalWithdrawn: 0,
        lastClaimDate: null,
        claimHistory: [],
        transactions: [],
        referralCode: generateReferralCode(username),
        referredBy: null,
        referrals: [],
        totalReferralBonus: 0,
        hasEnteredReferralCode: false,
        milestoneUnlocked: false,
        referralMultiplier: 1
    };

    users[email] = newUser;
    saveAllUsers(users);

    alert('✅ Registration successful! Please login.');
    showLogin();

    // Clear form
    document.getElementById('registerUsername').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirmPassword').value = '';
}

// Login Function
function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        alert('Please enter username and password');
        return;
    }

    const users = getAllUsers();
    
    // Find user by username
    let userEmail = null;
    let user = null;
    
    for (let email in users) {
        if (users[email].username.toLowerCase() === username.toLowerCase()) {
            userEmail = email;
            user = users[email];
            break;
        }
    }

    if (!user) {
        alert('❌ User not found!');
        return;
    }

    if (user.password !== password) {
        alert('❌ Incorrect password!');
        return;
    }

    // Save current user with email (for data lookup)
    currentUser = { email: userEmail };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));

    alert('✅ Login successful!');
    loadUserData();
    showDashboard();

    // Clear form
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

// Logout Function
function logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    currentUser = null;
    userData = null;
    alert('✅ Logged out successfully');
    showAuth();
    showLogin();
}

// Load User Data
function loadUserData() {
    const users = getAllUsers();
    userData = users[currentUser.email];
}

// Save User Data
function saveUserData() {
    const users = getAllUsers();
    users[currentUser.email] = userData;
    saveAllUsers(users);
}

// Update Dashboard UI
function updateDashboard() {
    if (!userData) return;

    // User Info
    document.getElementById('username').textContent = userData.username;
    
    // Calculate account age in days
    const accountAge = Math.floor((Date.now() - userData.createdAt) / (1000 * 60 * 60 * 24));
    document.getElementById('accountAge').textContent = accountAge;

    // Check if withdrawal is available (10 days)
    const canWithdraw = accountAge >= 10;
    document.getElementById('withdrawStatus').textContent = canWithdraw ? 
        'Withdrawal Status: ✅ Unlocked' : 
        `Withdrawal Status: 🔒 Locked (${10 - accountAge} days remaining)`;
    
    document.getElementById('withdrawStatus').style.color = canWithdraw ? '#4caf50' : '#ff4757';

    // Balance and Stats
    document.getElementById('totalBalance').textContent = userData.balance.toFixed(2);
    document.getElementById('depositedAmount').textContent = userData.deposited.toFixed(2);
    const totalDailyClaim = (userData.dailyClaim || 0) + (userData.dailyClaimBonus || 0);
    document.getElementById('dailyClaimAmount').textContent = totalDailyClaim.toFixed(2);
    document.getElementById('totalClaimed').textContent = userData.totalClaimed.toFixed(2);
    document.getElementById('totalWithdrawn').textContent = userData.totalWithdrawn.toFixed(2);

    // Withdraw button state
    const withdrawBtn = document.getElementById('withdrawBtn');
    withdrawBtn.disabled = !canWithdraw;
    document.getElementById('withdrawInfo').textContent = canWithdraw ? 
        'You can now withdraw!' : 
        `Available after ${10 - accountAge} more days`;

    // Referral Info
    updateReferralInfo();

    // Check if can claim today
    updateClaimButton();
    
    // Update calendar grid
    updateCalendarGrid();

    // Update transaction history
    displayTransactions();
}

// Update Referral Information
function updateReferralInfo() {
    if (!userData.referrals) userData.referrals = [];
    if (!userData.totalReferralBonus) userData.totalReferralBonus = 0;
    if (!userData.dailyClaimBonus) userData.dailyClaimBonus = 0;
    if (!userData.milestoneUnlocked) userData.milestoneUnlocked = false;
    if (!userData.referralMultiplier) userData.referralMultiplier = 1;

    // Display referral code
    document.getElementById('userReferralCode').value = userData.referralCode;

    // Display stats
    document.getElementById('totalReferrals').textContent = userData.referrals.length;
    document.getElementById('bonusEarned').textContent = userData.totalReferralBonus.toFixed(2);
    document.getElementById('dailyBonus').textContent = userData.dailyClaimBonus.toFixed(2);

    // Update milestone progress
    updateMilestone();

    // Update referral input status
    updateReferralInputStatus();

    // Display referral list
    displayReferralList();
}

// Update Milestone Progress
function updateMilestone() {
    const totalRefs = userData.referrals.length;
    const milestone = 3;
    const percentage = Math.min((totalRefs / milestone) * 100, 100);
    
    // Update progress bar
    const fillBar = document.getElementById('milestoneFill');
    fillBar.style.width = percentage + '%';
    if (percentage > 0) {
        fillBar.textContent = totalRefs + '/3';
    }
    
    // Update count
    document.getElementById('milestoneCount').textContent = totalRefs;
    
    // Update status message
    const statusText = document.getElementById('milestoneStatus');
    const rewardDiv = document.getElementById('milestoneReward');
    
    if (userData.milestoneUnlocked) {
        statusText.textContent = '🎉 Milestone Unlocked! You now earn 5x referral rewards!';
        rewardDiv.classList.add('unlocked');
    } else {
        const remaining = milestone - totalRefs;
        if (remaining > 0) {
            statusText.textContent = `Get ${remaining} more successful referral${remaining > 1 ? 's' : ''} to unlock 5x rewards on ALL future referrals!`;
        }
    }
}

// Update Referral Input Status
function updateReferralInputStatus() {
    const statusMessage = document.getElementById('referralStatusMessage');
    const statusText = document.getElementById('referralStatusText');
    const inputField = document.getElementById('dashboardReferralCode');
    const submitBtn = document.getElementById('submitRefBtn');
    
    if (userData.referredBy) {
        // Already has referrer
        const users = getAllUsers();
        const referrer = users[userData.referredBy];
        const referrerName = referrer ? referrer.username : 'Unknown';
        
        statusText.textContent = `You are linked to ${referrerName}'s referral code!`;
        statusMessage.textContent = '✅ Referral code already set';
        statusMessage.className = 'referral-status-message success';
        inputField.disabled = true;
        submitBtn.disabled = true;
    } else {
        statusText.textContent = 'Enter a friend\'s referral code to get linked as their referral!';
        statusMessage.textContent = '';
        inputField.disabled = false;
        submitBtn.disabled = false;
    }
}

// Display Referral List
function displayReferralList() {
    const referralListContainer = document.getElementById('referralList');
    
    if (!userData.referrals || userData.referrals.length === 0) {
        referralListContainer.innerHTML = '<p class="no-data">No referrals yet. Share your code to start earning!</p>';
        return;
    }

    let html = '';
    userData.referrals.forEach(ref => {
        const multiplierBadge = ref.multiplier === 5 ? ' <span class="multiplier-badge">5x</span>' : '';
        html += `
            <div class="referral-item">
                <div class="referral-item-header">
                    <span class="referral-username">👤 ${ref.username}</span>
                    <span class="referral-bonus">+${ref.bonus.toFixed(2)}${multiplierBadge}</span>
                </div>
                <div class="referral-deposit">💰 Deposited: ${ref.deposit.toFixed(2)}</div>
                <div class="referral-date">📅 ${ref.date}</div>
            </div>
        `;
    });

    referralListContainer.innerHTML = html;
}

// Copy Referral Code
function copyReferralCode() {
    const codeInput = document.getElementById('userReferralCode');
    codeInput.select();
    codeInput.setSelectionRange(0, 99999); // For mobile
    
    navigator.clipboard.writeText(codeInput.value).then(() => {
        alert('✅ Referral code copied!\n\nShare it with your friends: ' + codeInput.value);
    }).catch(() => {
        alert('📋 Your referral code: ' + codeInput.value);
    });
}

// Submit Referral Code from Dashboard
function submitReferralCode() {
    const referralCode = document.getElementById('dashboardReferralCode').value.trim().toUpperCase();
    
    if (!referralCode) {
        alert('Please enter a referral code');
        return;
    }
    
    // Cannot use own code
    if (referralCode === userData.referralCode) {
        alert('❌ You cannot use your own referral code!');
        return;
    }
    
    // Find user with this referral code
    const users = getAllUsers();
    let referrerEmail = null;
    
    for (let email in users) {
        if (users[email].referralCode === referralCode) {
            referrerEmail = email;
            break;
        }
    }
    
    if (!referrerEmail) {
        alert('❌ Invalid referral code!');
        return;
    }
    
    // Set referredBy
    userData.referredBy = referrerEmail;
    userData.hasEnteredReferralCode = true;
    
    saveUserData();
    updateReferralInfo();
    
    alert('✅ Referral code accepted!\n\nYou are now linked! Your referrer will receive a bonus when you make your first deposit.');
}

// Remove skipReferralCode function - no longer needed


// Update Calendar Grid
function updateCalendarGrid() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    // Initialize claim history if not exists
    if (!userData.claimHistory) {
        userData.claimHistory = [];
    }
    
    // Count total claims made
    const totalClaims = userData.claimHistory.length;
    
    // Determine current day (1-10)
    let currentDay = totalClaims + 1;
    if (currentDay > 10) currentDay = 10;
    
    // Check if can claim now
    const canClaimNow = !userData.lastClaimDate || 
        (Date.now() - userData.lastClaimDate) >= (24 * 60 * 60 * 1000);
    
    // Generate 10 days
    let html = '';
    for (let day = 1; day <= 10; day++) {
        let dayClass = 'calendar-day';
        
        if (day < currentDay) {
            // Already claimed
            dayClass += ' claimed';
        } else if (day === currentDay && canClaimNow) {
            // Can claim today
            dayClass += ' current';
        } else {
            // Locked
            dayClass += ' locked';
        }
        
        html += `<div class="${dayClass}">${day}</div>`;
    }
    
    calendarGrid.innerHTML = html;
}

// Deposit Coins
function depositCoins() {
    const amount = parseFloat(document.getElementById('depositAmount').value);

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    if (amount < 200) {
        alert('⚠️ Minimum deposit is 200 coins!');
        return;
    }

    const dailyClaim = amount / 8;
    
    // Check if this is user's first deposit and they were referred
    const isFirstDeposit = userData.deposited === 0;
    let referralBonus = 0;
    
    if (isFirstDeposit && userData.referredBy) {
        // Calculate base bonus
        const baseBonus = dailyClaim / 2;
        
        const users = getAllUsers();
        const referrer = users[userData.referredBy];
        
        if (referrer) {
            // Initialize milestone fields if needed
            if (!referrer.milestoneUnlocked) referrer.milestoneUnlocked = false;
            if (!referrer.referralMultiplier) referrer.referralMultiplier = 1;
            
            // Apply multiplier (1x or 5x)
            referralBonus = baseBonus * referrer.referralMultiplier;
            
            // Add bonus to referrer's daily claim
            referrer.dailyClaimBonus = (referrer.dailyClaimBonus || 0) + referralBonus;
            referrer.totalReferralBonus = (referrer.totalReferralBonus || 0) + referralBonus;
            
            // Add to referrer's referral list
            if (!referrer.referrals) referrer.referrals = [];
            referrer.referrals.push({
                username: userData.username,
                email: currentUser.email,
                deposit: amount,
                bonus: referralBonus,
                multiplier: referrer.referralMultiplier,
                date: new Date().toLocaleString(),
                timestamp: Date.now()
            });
            
            // Check if milestone should be unlocked (3 referrals)
            if (referrer.referrals.length >= 3 && !referrer.milestoneUnlocked) {
                referrer.milestoneUnlocked = true;
                referrer.referralMultiplier = 5;
            }
            
            // Save referrer's updated data
            users[userData.referredBy] = referrer;
            saveAllUsers(users);
        }
    }
    
    // Deposit does NOT add to balance - only adds to deposited amount and daily claim
    userData.deposited += amount;
    userData.dailyClaim += dailyClaim;
    userData.transactions.push({
        type: 'deposit',
        amount: amount,
        dailyClaimAdded: dailyClaim,
        timestamp: Date.now(),
        date: new Date().toLocaleString()
    });

    saveUserData();
    updateDashboard();
    
    document.getElementById('depositAmount').value = '';
    
    let message = `✅ Deposit successful!\n💰 Amount: ${amount.toFixed(2)}\n🎁 Daily Claim: ${dailyClaim.toFixed(2)}\n\nYour balance will increase when you claim daily rewards!`;
    
    if (referralBonus > 0) {
        const users = getAllUsers();
        const referrer = users[userData.referredBy];
        const multiplierText = referrer.referralMultiplier === 5 ? ' (5x Bonus!)' : '';
        message += `\n\n🎉 Your referrer earned a bonus of ${referralBonus.toFixed(2)} coins${multiplierText} added to their daily claim!`;
    }
    
    alert(message);
}

// Update Claim Button State
function updateClaimButton() {
    const claimBtn = document.getElementById('claimBtn');
    const nextClaimTime = document.getElementById('nextClaimTime');

    if (!userData.lastClaimDate) {
        claimBtn.disabled = false;
        nextClaimTime.textContent = 'Now';
        return;
    }

    const lastClaim = userData.lastClaimDate;
    const now = Date.now();
    const timeDiff = now - lastClaim;
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (timeDiff >= twentyFourHours) {
        // 24 hours have passed
        claimBtn.disabled = false;
        nextClaimTime.textContent = 'Now';
    } else {
        // Still waiting
        claimBtn.disabled = true;
        
        const remainingTime = twentyFourHours - timeDiff;
        const hours = Math.floor(remainingTime / (60 * 60 * 1000));
        const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
        
        nextClaimTime.textContent = `${hours}h ${minutes}m`;
    }
}

// Claim Daily Reward
function claimDaily() {
    if (userData.dailyClaim <= 0) {
        alert('⚠️ No daily claim available. Please deposit coins first!');
        return;
    }

    if (!userData.lastClaimDate) {
        // First claim
        processClaim();
        return;
    }

    const lastClaim = userData.lastClaimDate;
    const now = Date.now();
    const timeDiff = now - lastClaim;
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (timeDiff < twentyFourHours) {
        const remainingTime = twentyFourHours - timeDiff;
        const hours = Math.floor(remainingTime / (60 * 60 * 1000));
        const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
        
        alert(`⚠️ You already claimed recently!\nNext claim in: ${hours}h ${minutes}m`);
        return;
    }

    processClaim();
}

// Process Claim
function processClaim() {
    const baseClaim = userData.dailyClaim || 0;
    const bonusClaim = userData.dailyClaimBonus || 0;
    const claimAmount = baseClaim + bonusClaim;
    
    // Initialize claim history if not exists
    if (!userData.claimHistory) {
        userData.claimHistory = [];
    }
    
    // Add to claim history
    userData.claimHistory.push({
        day: userData.claimHistory.length + 1,
        timestamp: Date.now(),
        amount: claimAmount,
        baseAmount: baseClaim,
        bonusAmount: bonusClaim
    });
    
    userData.balance += claimAmount;
    userData.totalClaimed += claimAmount;
    userData.lastClaimDate = Date.now();
    userData.transactions.push({
        type: 'claim',
        amount: claimAmount,
        baseAmount: baseClaim,
        bonusAmount: bonusClaim,
        timestamp: Date.now(),
        date: new Date().toLocaleString()
    });

    saveUserData();
    updateDashboard();
    
    let message = `🎉 Daily Claim Successful!\n💰 You claimed: ${claimAmount.toFixed(2)} coins`;
    
    if (bonusClaim > 0) {
        message += `\n   ├─ Base: ${baseClaim.toFixed(2)}\n   └─ Referral Bonus: ${bonusClaim.toFixed(2)}`;
    }
    
    message += `\n💳 New Balance: ${userData.balance.toFixed(2)}\n📅 Day ${userData.claimHistory.length} of 10 completed!`;
    
    alert(message);
}

// Withdraw Coins
function withdrawCoins() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    if (amount > userData.balance) {
        alert('⚠️ Insufficient balance!');
        return;
    }

    // Check account age
    const accountAge = Math.floor((Date.now() - userData.createdAt) / (1000 * 60 * 60 * 24));
    if (accountAge < 10) {
        alert(`⚠️ Withdrawal locked! Your account must be 10 days old.\nCurrent age: ${accountAge} days\nDays remaining: ${10 - accountAge}`);
        return;
    }

    const confirm = window.confirm(`Withdraw ${amount.toFixed(2)} coins?\n\nThis will be processed to your game account.`);
    if (!confirm) return;

    userData.balance -= amount;
    userData.totalWithdrawn += amount;
    userData.transactions.push({
        type: 'withdraw',
        amount: amount,
        timestamp: Date.now(),
        date: new Date().toLocaleString()
    });

    saveUserData();
    updateDashboard();
    
    document.getElementById('withdrawAmount').value = '';
    alert(`✅ Withdrawal Successful!\n💸 Amount: ${amount.toFixed(2)}\n💳 Remaining Balance: ${userData.balance.toFixed(2)}`);
}

// Display Transaction History
function displayTransactions() {
    const historyContainer = document.getElementById('transactionHistory');
    
    if (!userData.transactions || userData.transactions.length === 0) {
        historyContainer.innerHTML = '<p class="no-data">No transactions yet</p>';
        return;
    }

    // Sort transactions by timestamp (newest first)
    const sortedTransactions = [...userData.transactions].sort((a, b) => b.timestamp - a.timestamp);

    let html = '';
    sortedTransactions.forEach(tx => {
        const icon = tx.type === 'deposit' ? '💳' : tx.type === 'claim' ? '🎁' : '💸';
        const sign = tx.type === 'withdraw' ? '-' : '+';
        
        html += `
            <div class="transaction-item ${tx.type}">
                <div>
                    <div class="transaction-type">${icon} ${tx.type.toUpperCase()}</div>
                    <div class="transaction-date">${tx.date}</div>
                </div>
                <div class="transaction-amount">${sign}${tx.amount.toFixed(2)}</div>
            </div>
        `;
    });

    historyContainer.innerHTML = html;
}

// Auto-update claim button every minute
setInterval(() => {
    if (userData) {
        updateClaimButton();
        updateCalendarGrid();
    }
}, 60000);

// ===== TESTING FUNCTIONS - You can use these in browser console =====

// Function to manually set account creation date (for testing withdrawal)
function setAccountAge(days) {
    if (!currentUser) {
        alert('Please login first');
        return;
    }
    
    const users = getAllUsers();
    const user = users[currentUser.email];
    
    // Set creation date to X days ago
    user.createdAt = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    saveAllUsers(users);
    loadUserData();
    updateDashboard();
    
    alert(`✅ Account age set to ${days} days for testing!`);
}

// Make available in console for testing
window.setAccountAge = setAccountAge;

// Function to clear all data (for testing)
function clearAllData() {
    if (confirm('⚠️ This will delete ALL user data. Continue?')) {
        localStorage.removeItem(STORAGE_KEYS.USERS);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        currentUser = null;
        userData = null;
        alert('✅ All data cleared!');
        showAuth();
        showLogin();
    }
}

window.clearAllData = clearAllData;

console.log('🎮 Game Reward System - Local Storage Version');
console.log('📝 Testing functions available:');
console.log('   setAccountAge(days) - Set account age for testing withdrawal');
console.log('   clearAllData() - Clear all user data');
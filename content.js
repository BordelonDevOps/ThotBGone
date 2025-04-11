// Content script for Thot-B-Gone
// Handles content filtering on X.com/Twitter

// Configuration object - will be populated from storage
const config = {
  enabled: true,
  blockAdultContent: true,
  blockOnlyFansFansly: true,
  showWarnings: true
};

// Keywords and patterns for content detection
const adultContentKeywords = [
  'nsfw', 'xxx', 'explicit', 'adult content', 'onlyfans', 
  'fansly', 'lewd', 'nude', 'nudes', 'subscribe', 'exclusive content'
];

const adultContentURLPatterns = [
  /onlyfans\.com/i, 
  /fansly\.com/i, 
  /fanvue\.com/i, 
  /mym\.fans/i,
  /patreon\.com\/adult/i
];

// Counter for tweets scanned in current session
let tweetsScannedCounter = 0;

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(['enabled', 'blockAdultContent', 'blockOnlyFansFansly', 'showWarnings'], result => {
    Object.assign(config, result);
    if (config.enabled) {
      runFilter();
    }
  });
}

// Report blocked content to background script for statistics tracking
function reportBlocked(contentType, elementType) {
  chrome.runtime.sendMessage({
    action: 'updateStats',
    contentType: contentType,
    elementType: elementType
  });
}

// Report tweets scanned (batched to reduce message frequency)
function reportTweetsScanned() {
  if (tweetsScannedCounter > 0) {
    chrome.runtime.sendMessage({
      action: 'updateStats',
      tweetsScanned: tweetsScannedCounter
    });
    tweetsScannedCounter = 0;
  }
}

// Main filtering function
function runFilter() {
  // Initial scan
  scanContent();
  
  // Set up observer for dynamic content
  const observer = new MutationObserver(mutations => {
    let shouldScan = false;
    
    // Check if any relevant content was added
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
      }
    });
    
    if (shouldScan) {
      scanContent();
    }
  });
  
  // Start observing document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Periodically report scanned tweets
  setInterval(reportTweetsScanned, 5000);
}

// Scan and filter content
function scanContent() {
  if (!config.enabled) return;
  
  // Process tweets
  const tweets = document.querySelectorAll('article[data-testid="tweet"]:not([data-thotbgone-processed])');
  
  if (tweets.length > 0) {
    tweetsScannedCounter += tweets.length;
    
    tweets.forEach(tweet => {
      // Mark as processed to avoid re-processing
      tweet.setAttribute('data-thotbgone-processed', 'true');
      
      const tweetText = tweet.textContent.toLowerCase();
      const links = Array.from(tweet.querySelectorAll('a[href]')).map(a => a.href);
      
      let shouldBlock = false;
      let blockType = '';
      
      // Check for adult content keywords
      if (config.blockAdultContent) {
        if (adultContentKeywords.some(keyword => tweetText.includes(keyword.toLowerCase()))) {
          shouldBlock = true;
          blockType = 'adult';
        }
      }
      
      // Check for OnlyFans/Fansly links
      if (config.blockOnlyFansFansly && !shouldBlock) {
        if (links.some(href => adultContentURLPatterns.some(pattern => pattern.test(href)))) {
          shouldBlock = true;
          blockType = 'onlyfans';
        }
      }
      
      // Block content if needed
      if (shouldBlock) {
        if (config.showWarnings) {
          // Create warning element
          const warningElement = document.createElement('div');
          warningElement.className = 'thotbgone-warning';
          warningElement.textContent = blockType === 'adult' ? 
            '🚫 Adult content blocked by Thot-B-Gone' : 
            '🚫 OnlyFans/Fansly content blocked by Thot-B-Gone';
          
          // Replace tweet with warning
          tweet.style.display = 'none';
          tweet.parentNode.insertBefore(warningElement, tweet);
        } else {
          // Just hide the tweet
          tweet.style.display = 'none';
        }
        
        // Report for statistics
        reportBlocked(blockType, 'tweet');
      }
    });
  }
  
  // Process profiles
  const profileBios = document.querySelectorAll('[data-testid="UserDescription"]:not([data-thotbgone-processed])');
  
  profileBios.forEach(bio => {
    bio.setAttribute('data-thotbgone-processed', 'true');
    
    const bioText = bio.textContent.toLowerCase();
    
    // Check for adult content or OnlyFans/Fansly mentions in bio
    if ((config.blockAdultContent && adultContentKeywords.some(keyword => bioText.includes(keyword.toLowerCase()))) ||
        (config.blockOnlyFansFansly && adultContentURLPatterns.some(pattern => pattern.test(bioText)))) {
      
      // Add warning to profile
      const profileContainer = bio.closest('[data-testid="primaryColumn"]');
      if (profileContainer) {
        profileContainer.classList.add('thotbgone-filtered-profile');
        
        if (config.showWarnings) {
          const warningElement = document.createElement('div');
          warningElement.className = 'thotbgone-profile-warning';
          warningElement.textContent = '⚠️ This profile may contain adult content (filtered by Thot-B-Gone)';
          
          bio.parentNode.insertBefore(warningElement, bio);
        }
        
        // Report for statistics
        reportBlocked(
          bioText.includes('onlyfans') || bioText.includes('fansly') ? 'onlyfans' : 'adult', 
          'profile'
        );
      }
    }
  });
  
  // Process links
  const links = document.querySelectorAll('a[href]:not([data-thotbgone-processed])');
  
  links.forEach(link => {
    link.setAttribute('data-thotbgone-processed', 'true');
    
    const href = link.href.toLowerCase();
    
    // Check for OnlyFans/Fansly links
    if (config.blockOnlyFansFansly && adultContentURLPatterns.some(pattern => pattern.test(href))) {
      if (config.showWarnings) {
        const originalText = link.textContent;
        link.textContent = '🚫 Blocked link';
        link.classList.add('thotbgone-blocked-link');
        link.title = 'Link to adult content site blocked by Thot-B-Gone';
        link.href = '#blocked';
        link.onclick = (e) => {
          e.preventDefault();
          return false;
        };
      } else {
        link.style.display = 'none';
      }
      
      // Report for statistics
      reportBlocked('onlyfans', 'link');
    }
  });
}

// Initialize
loadSettings();

// Listen for settings changes
chrome.storage.onChanged.addListener(changes => {
  // Update local config
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (key in config) {
      config[key] = newValue;
    }
  }
  
  // If enabled state changed, handle accordingly
  if (changes.enabled) {
    if (changes.enabled.newValue) {
      runFilter();
    }
  }
});

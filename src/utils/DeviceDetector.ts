export class DeviceDetector {
  private static _isMobile: boolean | null = null;

  static isMobile(): boolean {
    // Cache the result to avoid repeated checks
    if (this._isMobile !== null) {
      return this._isMobile;
    }

    // Check user agent for mobile keywords
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
      'android',
      'webos',
      'iphone',
      'ipad',
      'ipod',
      'blackberry',
      'windows phone',
      'mobile'
    ];
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));

    // Check if device has touch capability
    const hasTouchScreen =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0;

    // Check viewport width (typical mobile breakpoint)
    const isSmallScreen = window.innerWidth < 768;

    // Consider it mobile if ANY of these conditions are true
    this._isMobile = isMobileUA || (hasTouchScreen && isSmallScreen);

    console.log('Device Detection:', {
      isMobileUA,
      hasTouchScreen,
      isSmallScreen,
      result: this._isMobile,
      width: window.innerWidth
    });

    return this._isMobile;
  }

  static resetCache(): void {
    this._isMobile = null;
  }
}

// Export a convenient function
export function isMobile(): boolean {
  return DeviceDetector.isMobile();
}

import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Dimensions, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Component for regular tab items with premium pop-up ("timbul") micro-animations
function TabItem({ isFocused, iconName, onPress, onLongPress }: any) {
  const animatedValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 40,
    }).start();
  }, [isFocused]);

  // Translate up by 10 pixels when active
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  // Scale up by 20% when active
  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ translateY }, { scale }], alignItems: 'center' }}>
        <Ionicons
          name={iconName}
          size={24}
          color={isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)'}
        />
        {/* Glowing Indicator Dot under the active icon */}
        <Animated.View
          style={[
            styles.indicatorDot,
            {
              opacity: animatedValue,
              transform: [
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// Component for the elevated Center Scan Button with pop-up & rotation animations
function CenterScanButton({ isFocused, onPress }: any) {
  const animatedValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 5,
      tension: 40,
    }).start();
  }, [isFocused]);

  // Scales up by 15% when selected
  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  // Subtle rotation effect for the scanner icon when selected
  const rotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.centerButton}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.centerButtonInner}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="scan" size={28} color="#FFFFFF" />
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  
  // Calculate dynamic dimensions
  const { width: screenWidth } = Dimensions.get('window');
  const tabBarWidth = screenWidth - 40; // 20px margins on left and right
  const centerX = tabBarWidth / 2;
  const barHeight = 65;
  const notchH = 28;
  const r = 24; // Border radius for the floating tab bar corners

  // Adjust bottom margin dynamically based on safe area insets (e.g. gesture navigation bars)
  const bottomMargin = insets.bottom > 0 ? insets.bottom + 8 : 20;

  // Custom SVG path drawing a rounded rectangle with a smooth, concave scoop (notch) in the middle
  const d = `
    M 0 ${r}
    A ${r} ${r} 0 0 1 ${r} 0
    L ${centerX - 45} 0
    C ${centerX - 30} 0, ${centerX - 20} ${notchH}, ${centerX} ${notchH}
    C ${centerX + 20} ${notchH}, ${centerX + 30} 0, ${centerX + 45} 0
    L ${tabBarWidth - r} 0
    A ${r} ${r} 0 0 1 ${tabBarWidth} ${r}
    L ${tabBarWidth} ${barHeight - r}
    A ${r} ${r} 0 0 1 ${tabBarWidth - r} ${barHeight}
    L ${r} ${barHeight}
    A ${r} ${r} 0 0 1 0 ${barHeight - r}
    Z
  `;

  return (
    <View style={[styles.tabBarContainer, { bottom: bottomMargin }]}>
      {/* SVG Glassmorphism Background */}
      <View style={styles.svgContainer}>
        <Svg width={tabBarWidth} height={barHeight}>
          <Path
            d={d}
            fill="rgba(55, 58, 52, 0.85)" // Elegant dark translucent grey-brown background
            stroke="rgba(255, 255, 255, 0.15)" // Subtle white border for the glassmorphism highlight
            strokeWidth={1.5}
          />
        </Svg>
      </View>

      {/* Interactive Icons */}
      <View style={styles.tabItemsContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Render spacer for the Scan tab (index 2) so the center is visually empty for the floating button
          if (index === 2) {
            return (
              <View key={route.key} style={styles.tabItemPlaceholder} />
            );
          }

          // Icon Mapping based on Mockup
          let iconName: any = 'home-outline';
          if (route.name === 'Dashboard') {
            iconName = isFocused ? 'home' : 'home-outline';
          } else if (route.name === 'History') {
            iconName = isFocused ? 'time' : 'time-outline';
          } else if (route.name === 'Eco Poin') {
            iconName = isFocused ? 'school' : 'school-outline'; // Graduation cap icon
          } else if (route.name === 'Profil') {
            iconName = isFocused ? 'person' : 'person-outline';
          }

          return (
            <TabItem
              key={route.key}
              isFocused={isFocused}
              iconName={iconName}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>

      {/* Floating Center Elevated Scan Button Container */}
      <View style={[styles.centerButtonContainer, { left: centerX - 30 }]}>
        {(() => {
          const scanRoute = state.routes[2];
          const isFocused = state.index === 2;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: scanRoute.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(scanRoute.name);
            }
          };

          return (
            <CenterScanButton
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 65,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 99,
  },
  svgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabItemsContainer: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabItemPlaceholder: {
    flex: 1,
    height: '100%',
  },
  indicatorDot: {
    position: 'absolute',
    bottom: -8, // Positioned slightly below the icon
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981', // Glowing emerald dot
  },
  centerButtonContainer: {
    position: 'absolute',
    top: -24, // Floats 24px above the bottom bar
    width: 60,
    height: 60,
    zIndex: 5,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  centerButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981', // Solid vibrant emerald green
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)', // White glass-like border around the button
  },
});

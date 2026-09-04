import React from "react";
import { View, Text, Image } from "react-native";
import { cn } from "@utils/cn";
import { getInitials } from "@utils/helpers";

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  className?: string;
}

export function Avatar({ uri, name, size = 48, className }: AvatarProps) {
  const [hasError, setHasError] = React.useState(false);

  if (uri && !hasError) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setHasError(true)}
        className={className}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#6C5CE7",
      }}
      className={cn("items-center justify-center", className)}
    >
      <Text
        style={{ fontSize: size * 0.4 }}
        className="font-bold text-white"
      >
        {getInitials(name || "?")}
      </Text>
    </View>
  );
}

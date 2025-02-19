import base64

# Base64 encoded private key
base64_key = "selcWKIov7AsCgRFSiH4oUpPSld9jylWJmso+mgUN8vNwj7dQKek+TzWg19+XR4iNAqbLdQIUlqICzS5kv2itg=="

# Decode the base64 encoded key
binary_key = base64.b64decode(base64_key)

# Convert binary data to hexadecimal
hex_key = binary_key.hex()

print(f"Hexadecimal private key: {hex_key}")

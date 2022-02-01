for file in *
do
cwebp -q 80 -alpha_q 100 "$file" -o "${file%.png}.webp"
done
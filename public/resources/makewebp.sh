for file in pngs/*
do
cwebp -q 80 -resize 500 500 -alpha_q 100 "$file" -o "./${file%.png}.webp"
mv "$file" ./
done
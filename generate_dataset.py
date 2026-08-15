import os
import cv2
import csv
import argparse
import numpy as np

def draw_sem_features_random(width, height, style='DRAM', seed=42):
    """Generates a realistic, globally unique semiconductor master layout."""
    np.random.seed(seed)
    img = np.zeros((height, width), dtype=np.float32)
    if style == 'DRAM':
        # DRAM style: A grid of contact holes with randomized diameters, slight offsets, and missing holes
        pitch_x = 240
        pitch_y = 240
        for y in range(pitch_y // 2, height, pitch_y):
            for x in range(pitch_x // 2, width, pitch_x):
                dx = int(np.random.uniform(-20, 20))
                dy = int(np.random.uniform(-20, 20))
                radius = int(np.random.uniform(55, 85))
                # 10% chance of a missing contact hole (programmed defect/variation)
                if np.random.rand() > 0.10:
                    cv2.circle(img, (x + dx, y + dy), radius, 0.8, -1)
    else:
        # FinFET/Logic style: vertical fins and horizontal gates of varying widths and non-uniform spacing
        curr_x = 100
        while curr_x < width - 100:
            w = int(np.random.uniform(30, 90))
            cv2.rectangle(img, (curr_x, 0), (curr_x + w, height), 0.6, -1)
            curr_x += w + int(np.random.uniform(100, 300))
        curr_y = 100
        while curr_y < height - 100:
            h = int(np.random.uniform(50, 120))
            cv2.rectangle(img, (0, curr_y), (width, curr_y + h), 0.9, -1)
            curr_y += h + int(np.random.uniform(150, 450))
    return img

def apply_edge_brightening(img, strength=1.5, kernel_size=5):
    """Applies edge-brightening to mimic real SEM image behavior."""
    if kernel_size > 0:
        gray = (img * 255).astype(np.uint8)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
        gradient = cv2.morphologyEx(gray, cv2.MORPH_GRADIENT, kernel)
        grad_normalized = gradient.astype(np.float32) / 255.0
        brightened = img + grad_normalized * strength
        return np.clip(brightened, 0.0, 1.0)
    return img

def add_sem_noise(img, shot_noise_factor=50, gaussian_blur_sigma=1.0, speckle_strength=0.1, charging_streaks=True):
    """Applies various noise models to simulate SEM degradation."""
    noisy = img.copy()
    
    # 1. Asymmetric Gaussian Blur (astigmatism/blur)
    sigma_x = gaussian_blur_sigma * np.random.uniform(0.8, 1.2)
    sigma_y = gaussian_blur_sigma * np.random.uniform(0.8, 1.2)
    noisy = cv2.GaussianBlur(noisy, (0, 0), sigmaX=sigma_x, sigmaY=sigma_y)
    
    # 2. Shot Noise (Poisson noise)
    if shot_noise_factor > 0:
        scale = shot_noise_factor
        noisy_scaled = np.random.poisson(noisy * scale) / scale
        noisy = np.clip(noisy_scaled, 0.0, 1.0)
        
    # 3. Speckle Noise
    if speckle_strength > 0:
        noise = np.random.normal(0, speckle_strength, img.shape)
        noisy = np.clip(noisy + noisy * noise, 0.0, 1.0)
        
    # 4. Charging Streaks (horizontal scanline noise)
    if charging_streaks:
        h, w = img.shape
        num_streaks = np.random.randint(5, 15)
        for _ in range(num_streaks):
            y = np.random.randint(0, h)
            streak_w = np.random.randint(1, 3)
            intensity = np.random.uniform(0.05, 0.25)
            noisy[y:y+streak_w, :] = np.clip(noisy[y:y+streak_w, :] + intensity, 0.0, 1.0)
            
    return (noisy * 255).astype(np.uint8)

def generate_pair(style='DRAM', seed=42):
    """Generates a Reference-Search image pair with exact ground truth center."""
    np.random.seed(seed)
    
    master_w, master_h = 12000, 12000
    master = draw_sem_features_random(master_w, master_h, style=style, seed=seed)
    master_eb = apply_edge_brightening(master, strength=np.random.uniform(1.2, 1.8))
    
    X_m = np.random.uniform(4000, 8000)
    Y_m = np.random.uniform(4000, 8000)
    
    # Extract Reference image
    ref_x_start = int(X_m - 500)
    ref_y_start = int(Y_m - 500)
    ref_img_clean = master_eb[ref_y_start:ref_y_start+1000, ref_x_start:ref_x_start+1000]
    ref_img = add_sem_noise(ref_img_clean, shot_noise_factor=100, gaussian_blur_sigma=0.8, speckle_strength=0.05, charging_streaks=False)
    
    # Create Search image with rotation, scaling and translation drift
    theta_deg = np.random.uniform(-3.0, 3.0)
    theta_rad = np.radians(theta_deg)
    
    scale_factor = np.random.uniform(0.95, 1.05)
    s = scale_factor / 10.0
    
    dx = np.random.uniform(-80, 80)
    dy = np.random.uniform(-80, 80)
    
    cos_t = np.cos(theta_rad)
    sin_t = np.sin(theta_rad)
    
    M = np.zeros((2, 3), dtype=np.float32)
    M[0, 0] = cos_t * s
    M[0, 1] = -sin_t * s
    M[0, 2] = 500 + dx - (cos_t * s * 6000 - sin_t * s * 6000)
    
    M[1, 0] = sin_t * s
    M[1, 1] = cos_t * s
    M[1, 2] = 500 + dy - (sin_t * s * 6000 + cos_t * s * 6000)
    
    search_img_clean = cv2.warpAffine(master_eb, M, (1000, 1000), flags=cv2.INTER_LINEAR)
    search_img = add_sem_noise(search_img_clean, shot_noise_factor=40, gaussian_blur_sigma=1.5, speckle_strength=0.15, charging_streaks=True)
    
    x_s = cos_t * s * (X_m - 6000) - sin_t * s * (Y_m - 6000) + 500 + dx
    y_s = sin_t * s * (X_m - 6000) + cos_t * s * (Y_m - 6000) + 500 + dy
    
    metadata = {
        "seed": seed,
        "style": style,
        "rotation_deg": theta_deg,
        "scale_ratio": 1.0 / scale_factor,
        "drift_x": dx,
        "drift_y": dy,
        "gt_x": float(x_s),
        "gt_y": float(y_s)
    }
    
    return ref_img, search_img, metadata

def main():
    parser = argparse.ArgumentParser(description="Synthetic SEM Dataset Generator for Drift-Sense")
    parser.add_argument("--style", type=str, default="DRAM", choices=["DRAM", "FinFET"], help="Semiconductor structure style")
    parser.add_argument("--num_pairs", type=int, default=30, help="Number of Reference-Search pairs to generate")
    parser.add_argument("--out_dir", type=str, default="./dataset", help="Output directory to save generated dataset")
    args = parser.parse_args()
    
    os.makedirs(args.out_dir, exist_ok=True)
    
    manifest_path = os.path.join(args.out_dir, "manifest.csv")
    with open(manifest_path, mode="w", newline="") as csv_file:
        fieldnames = ["ref_path", "search_path", "gt_x", "gt_y", "style", "rotation_deg", "scale_ratio", "drift_x", "drift_y"]
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        
        print(f"Generating {args.num_pairs} {args.style}-style image pairs inside {args.out_dir}...")
        for i in range(args.num_pairs):
            seed = 1000 + i
            ref_img, search_img, meta = generate_pair(style=args.style, seed=seed)
            
            ref_filename = f"ref_{i}.png"
            search_filename = f"search_{i}.png"
            
            ref_filepath = os.path.join(args.out_dir, ref_filename)
            search_filepath = os.path.join(args.out_dir, search_filename)
            
            cv2.imwrite(ref_filepath, ref_img)
            cv2.imwrite(search_filepath, search_img)
            
            writer.writerow({
                "ref_path": os.path.abspath(ref_filepath),
                "search_path": os.path.abspath(search_filepath),
                "gt_x": f"{meta['gt_x']:.3f}",
                "gt_y": f"{meta['gt_y']:.3f}",
                "style": meta["style"],
                "rotation_deg": f"{meta['rotation_deg']:.3f}",
                "scale_ratio": f"{meta['scale_ratio']:.3f}",
                "drift_x": f"{meta['drift_x']:.3f}",
                "drift_y": f"{meta['drift_y']:.3f}"
            })
            
            if (i + 1) % 5 == 0 or (i + 1) == args.num_pairs:
                print(f"Progress: {i + 1}/{args.num_pairs} pairs saved.")
                
    print(f"Dataset generation complete! Manifest saved to {os.path.abspath(manifest_path)}")

if __name__ == "__main__":
    main()

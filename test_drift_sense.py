import os
import cv2
import numpy as np
import time
import csv

# Import our custom scripts from scratch
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from generate_dataset import generate_pair
from localize import locate_pattern

def run_benchmarks(num_pairs=30, out_dir="/workspace/scratch/test_dataset"):
    os.makedirs(out_dir, exist_ok=True)
    
    print("=" * 60)
    print("DRIFT-SENSE BENCHMARKING AND VALIDATION UTILITY")
    print("=" * 60)
    
    errors = []
    runtimes = []
    styles = []
    
    # 15 DRAM, 15 FinFET pairs to make 30 varied cases as required by the spec
    print(f"Generating and evaluating {num_pairs} test image pairs...")
    
    csv_results_path = os.path.join(out_dir, "benchmark_results.csv")
    with open(csv_results_path, mode="w", newline="") as csv_file:
        fieldnames = ["id", "style", "true_x", "true_y", "pred_x", "pred_y", "euclidean_error", "runtime_ms", "status"]
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        
        for i in range(num_pairs):
            style = "DRAM" if i < (num_pairs // 2) else "FinFET"
            seed = 5000 + i
            
            # Generate pair
            ref_img, search_img, meta = generate_pair(style=style, seed=seed)
            
            # Run localization inference and measure execution time
            start_time = time.time()
            pred_coords, score = locate_pattern(ref_img, search_img)
            runtime_ms = (time.time() - start_time) * 1000
            
            # Compute accuracy metric
            true_coords = (meta["gt_x"], meta["gt_y"])
            error = np.sqrt((pred_coords[0] - true_coords[0])**2 + (pred_coords[1] - true_coords[1])**2)
            
            errors.append(error)
            runtimes.append(runtime_ms)
            styles.append(style)
            
            status = "PASS" if error <= 5.0 else "FAIL"
            writer.writerow({
                "id": i,
                "style": style,
                "true_x": f"{true_coords[0]:.3f}",
                "true_y": f"{true_coords[1]:.3f}",
                "pred_x": f"{pred_coords[0]:.3f}",
                "pred_y": f"{pred_coords[1]:.3f}",
                "euclidean_error": f"{error:.3f}",
                "runtime_ms": f"{runtime_ms:.1f}",
                "status": status
            })
            
            print(f"Pair {i+1:02d}/{num_pairs:02d} ({style:6s}): Error = {error:5.2f} px | Runtime = {runtime_ms:5.1f} ms | Score = {score:.3f}")
            
    # Calculate threshold-wise pass rates (5-, 4-, 2-, and 1-pixel)
    errors = np.array(errors)
    runtimes = np.array(runtimes)
    
    pass_5px = np.mean(errors <= 5.0) * 100
    pass_4px = np.mean(errors <= 4.0) * 100
    pass_2px = np.mean(errors <= 2.0) * 100
    pass_1px = np.mean(errors <= 1.0) * 100
    
    mean_err = np.mean(errors)
    median_err = np.median(errors)
    worst_err = np.max(errors)
    
    mean_time = np.mean(runtimes)
    total_time = np.sum(runtimes)
    
    print("\n" + "=" * 60)
    print("VALIDATION METRICS SUMMARY")
    print("=" * 60)
    print(f"Total Evaluated Cases  : {num_pairs}")
    print(f"Mean Euclidean Error   : {mean_err:.3f} pixels")
    print(f"Median Euclidean Error : {median_err:.3f} pixels")
    print(f"Worst-Case Error       : {worst_err:.3f} pixels")
    print("-" * 60)
    print(f"Pass Rate @ 5-pixel threshold : {pass_5px:6.2f}%")
    print(f"Pass Rate @ 4-pixel threshold : {pass_4px:6.2f}%")
    print(f"Pass Rate @ 2-pixel threshold : {pass_2px:6.2f}%")
    print(f"Pass Rate @ 1-pixel threshold : {pass_1px:6.2f}%")
    print("-" * 60)
    print(f"Mean Runtime per Pair  : {mean_time:.1f} ms")
    print(f"Total Benchmark Time   : {total_time/1000:.2f} seconds")
    print("=" * 60)
    
    # Save a clean readable text report
    report_path = os.path.join(out_dir, "validation_report.txt")
    with open(report_path, "w") as rf:
        rf.write("=" * 60 + "\n")
        rf.write("DRIFT-SENSE VALIDATION REPORT\n")
        rf.write("=" * 60 + "\n")
        rf.write(f"Total Evaluated Cases  : {num_pairs}\n")
        rf.write(f"Mean Euclidean Error   : {mean_err:.3f} pixels\n")
        rf.write(f"Median Euclidean Error : {median_err:.3f} pixels\n")
        rf.write(f"Worst-Case Error       : {worst_err:.3f} pixels\n\n")
        rf.write("-" * 60 + "\n")
        rf.write(f"Pass Rate @ 5-pixel threshold : {pass_5px:.2f}%\n")
        rf.write(f"Pass Rate @ 4-pixel threshold : {pass_4px:.2f}%\n")
        rf.write(f"Pass Rate @ 2-pixel threshold : {pass_2px:.2f}%\n")
        rf.write(f"Pass Rate @ 1-pixel threshold : {pass_1px:.2f}%\n")
        rf.write("-" * 60 + "\n")
        rf.write(f"Mean Runtime per Pair  : {mean_time:.1f} ms\n")
        rf.write(f"Total Benchmark Time   : {total_time/1000:.2f} seconds\n")
        rf.write("=" * 60 + "\n")
        
    print(f"CSV manifest saved to {csv_results_path}")
    print(f"Text report saved to {report_path}")

if __name__ == "__main__":
    run_benchmarks()

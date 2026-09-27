# Handover Document: WTFThis.com Multimodal AI Engine Prototyping

## 1. Project Context & Objectives
**WTFThis.com** (`WTFThis`) is a developer-centric utility tool designed to map, categorize, and diagnose physical objects (specifically household electronics, small adapters, legacy hardware, and "forgotten tech clutter"). The core engineering problem is deploying robust computer vision pipeline logic via local flagship desktop models (**Astra 6 / Opus 5.5**) to build deterministic device matching matrices.

The long-term objective of this inventory workflow is parsing down a legacy inventory cache to decide between utility deployment, archiving, or liquidation for charity proceeds.

---

## 2. Real-World Training & Edge-Case Datasets
The physical device pile discussed during our sessions serves as an excellent benchmark dataset for extreme visual variation, overlapping device signatures, and misleading structural shapes.

### Dataset Example 1: Pure Component Verification via Barcode/Label
*   **Media Reference:** `image_wcj9We.png` (Barcode/Packaging label verification)
*   **Visual State:** Transparent/poly-bagged item completely enclosed with white thermal labels. No bare components exposed.
*   **Target Entities:** 
    *   `UGREEN` RJ45 Female-to-Female Ethernet Coupler 5-Pack.
    *   SKU/Identifiers: `X000B56PAL`, `20311P5`, UPC/EAN `6957303825417`.
*   **LLM Pipeline Logic Rules:**
    1.  **Prioritize OCR Stack:** If explicit product barcodes or brand strings are visible, bypass standard component shape classifiers. Treat label text strings as the ground truth.
    2.  **Contextual Storage Mapping:** Map the component category to its micro-storage container (e.g., Categorized under: `"small data adapters" / Tupperware storage bin`).

### Dataset Example 2: Ambiguous Geometry & Misleading Component Signatures
*   **Media Reference:** `image_kOnYoC.png` (Overlapping electronics heap)
*   **Visual State:** Dense cluster combining classic amber filament bulbs, white globe LEDs, small-base candle bulbs, and two loose white oblong plastic pods.
*   **The "False Positive" Trap:** The user structurally labeled the entire pile as a "shit ton of smart bulbs" alongside missing "Eufy cameras." 
*   **Target Entities Detected:**
    *   `Aigostar` Filament Bulb G80 E27 Amber (4-Pack Box).
    *   `ExtraStar` 6W E14 LED Candle Bulbs (6-Pack Box).
    *   `Arlo` Wireless Smart Security Lights (Model: `AL1101`) — *Identified via the subtle side-stamped brand logo and flat diffuser window panel.*
*   **LLM Pipeline Logic Rules:**
    1.  **Differentiate Co-located Sub-components:** In a combined heap, do not assume all items share the container's primary class (e.g., do not classify the Arlo lights as smart bulbs or Eufy cameras despite the user's textual pre-bias).
    2.  **Physical Interface Extraction:** Read the port shape under weather-proofing flaps. For instance, the `Arlo AL1101` exposes a Micro-USB interface rather than a Type-C socket.

---

## 3. The Power & Charging Heuristic Matrix
Flagship models require a standardized logic tree to solve the common user problem: *"What cable charges this unlabeled gadget?"* Below is the system-wide matrix ruleset for deployment.

| Identified Sub-Brand | Visual Port Signature | Required Power Delivery Target | Resolution Strategy |
| :--- | :--- | :--- | :--- |
| **Arlo Security Light** | Weather-proof rubber seal flap covering flat asymmetrical trapezoid pinout | 5V / 1A - 2A Micro-USB | Map directly to generic legacy smartphone cable lines. |
| **Eufy Camera (Legacy Gen)** | Bottom/Rear heavy rubberized flap covering narrow legacy trapezoid interface | 5V / 2A Micro-USB | Support standard USB charging blocks or direct link to Eufy HomeBase USB auxiliary ports. |
| **Eufy Camera (Current Gen)** | Centered oval round interface socket | 5V / 2A or 9V / 2A USB Type-C | Map directly to universal Type-C Power Delivery lines. |

---

## 4. Next-Gen Repository Deployment Roadmap
To pivot from a browser-based context to definitive repo-level modifications using Astra 6 or Opus 5.5, implement the following local tasks:

1.  **Establish Visual Evaluation Tests (`/tests/visual_eval`):** Commit the two provided image states as gold-standard benchmark fixtures for your model's classification validation.
2.  **Structure JSON Schema Output:** Force the local model to return exact structural objects rather than prose paragraphs:
    ```json
    {
      "detected_object": "Arlo Smart Security Light",
      "model_number": "AL1101",
      "power_interface": "Micro-USB",
      "storage_destination": "Electronics Cache",
      "charity_liquidation_value": "Medium"
    }
    ```
3.  **Integrate Inventory Filtering:** Write a routing layer that auto-flags items without modern practical use cases (e.g., standard Ethernet couplers when the household is completely wireless) to be bucketed into the **Charity Donation Stream**.

def to_px(value, val_min, val_max, px_start, px_range):
    """
    Convertit une val in [val_min, val_max]
    en px in [px_start, px_start + px_range].
    max(val_max - val_min, 1) pour pas x/0
    """
    return px_start + ((value - val_min) / max(val_max - val_min, 1)) * px_range
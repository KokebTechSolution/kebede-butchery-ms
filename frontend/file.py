import os

# Define the folder and file structure as a nested dictionary
structure = {
    "src": {
        "api": [
            "staff.js",
            "inventory.js",
            "auth.js",
        ],
        "components": {
            "": [  # files directly inside components
                "SidebarNav.jsx",
                "Topbar.jsx",
            ],
            "Dashboard": [
                "SalesSummary.jsx",
                "StockAlerts.jsx",
                "EmployeeActivity.jsx",
                "StaffRequests.jsx",
            ],
            "Modals": [
                "RoleAssignmentModal.jsx",
                "RequestApprovalModal.jsx",
            ],
        },
        "pages": {
            "": [
                "Dashboard.jsx",
            ],
            "Staff": [
                "StaffListPage.jsx",
                "AddStaffForm.jsx",
                "EditStaffForm.jsx",
            ],
            "Inventory": [
                "InventoryListPage.jsx",
                "AddInventoryItem.jsx",
                "InventoryRequests.jsx",
                "TransferItems.jsx",
            ],
            "Auth": [
                "Login.jsx",
            ],
        },
    }
}

def create_structure(base_path, struct):
    for name, content in struct.items():
        path = os.path.join(base_path, name)
        if not os.path.exists(path):
            os.makedirs(path)
            print(f"Created directory: {path}")
        if isinstance(content, dict):
            create_structure(path, content)
        elif isinstance(content, list):
            for filename in content:
                file_path = os.path.join(path, filename)
                if not os.path.exists(file_path):
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write("")  # create empty file
                    print(f"Created file: {file_path}")

if __name__ == "__main__":
    create_structure(".", structure)

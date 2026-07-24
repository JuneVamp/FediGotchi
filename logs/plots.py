import csv
import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv('relationships_log.csv',header=None, names=['timestamp', 'pet_name', 'thing_name', 'friendliness'])
df2 = pd.read_csv('activity_finished_log.csv', header=None, names=['timestamp' , 'pet_name', 'activity_name', 'thing_name', 'liked'])
print(len(df), len(df2))
# df  = pd.merge(df,df2)
print(len(df))

df = df[df['pet_name'] == "alice"]

fig, ax = plt.subplots()
# for index, row in df.iterrows():
#     if index > 10000:
#         break
line = ""
for thing_name in df['thing_name'].unique():
    # if ("@" in thing_name):
        line, = plt.plot(df[df['thing_name'] == thing_name].reset_index()['friendliness'], label = thing_name)

names = df[df['thing_name'] == thing_name].reset_index()['thing_name']

annot = ax.annotate("", xy=(0,0), xytext=(-20,20),textcoords="offset points",
                    bbox=dict(boxstyle="round", fc="w"),
                    arrowprops=dict(arrowstyle="->"))
annot.set_visible(False)

def update_annot(ind):
    x,y = line.get_data()
    annot.xy = (x[ind["ind"][0]], y[ind["ind"][0]])
    text = "{}, {}".format(" ".join(list(map(str,ind["ind"]))), 
                           " ".join([names[n] for n in ind["ind"]]))
    annot.set_text(text)
    annot.get_bbox_patch().set_alpha(0.4)


def hover(event):
    vis = annot.get_visible()
    if event.inaxes == ax:
        cont, ind = line.contains(event)
        if cont:
            update_annot(ind)
            annot.set_visible(True)
            fig.canvas.draw_idle()
        else:
            if vis:
                annot.set_visible(False)
                fig.canvas.draw_idle()

fig.canvas.mpl_connect("motion_notify_event", hover)

# plt.legend()
# ax.legend(loc='center left', bbox_to_anchor=(1, 0.5))
plt.show()
# df.head()